"""Bronze, silver and gold on small hand-made inputs, one rule per test."""

import json
from datetime import datetime, timezone

import pytest

from foundry import bronze, gold, silver
from foundry.contracts import ContractViolation
from foundry.lake import Lake
from tests.conftest import make_event, write_lines

T0 = datetime(2026, 11, 11, 16, 30, tzinfo=timezone.utc)


def land(spark, contract, lake, tmp_path, events, run_id="r1"):
    f = write_lines(tmp_path / f"{run_id}.jsonl", events)
    df = bronze.read_landing(spark, f, run_id, "test", T0)
    return bronze.land(spark, lake, contract, df, run_id)


def test_bronze_keeps_everything_with_metadata(spark, contract, tmp_path):
    lake = Lake(tmp_path / "lake")
    out = land(spark, contract, lake, tmp_path, [make_event(1), "{broken"])
    assert out["rows_out"] == 2
    rows = {r["_line"]: r for r in lake.read(spark, contract.bronze).collect()}
    assert rows[1]["event_id"] == "evt-1" and rows[1]["event_hour"] == "2026-11-11T16"
    assert rows[2]["raw"] == "{broken" and rows[2]["event_id"] is None
    assert rows[2]["event_hour"] == "2026-11-11T16"  # falls back to the ingest hour
    assert all(r["_run_id"] == "r1" and r["_ingested_at"] is not None for r in rows.values())


def test_landing_the_same_run_twice_is_a_no_op(spark, contract, tmp_path):
    lake = Lake(tmp_path / "lake")
    land(spark, contract, lake, tmp_path, [make_event(1)])
    again = land(spark, contract, lake, tmp_path, [make_event(1)])
    assert again["already_landed"] and again["rows_out"] == 0
    assert lake.read(spark, contract.bronze).count() == 1


@pytest.mark.parametrize(
    "event, reason",
    [
        ("{not json", "malformed_json"),
        (make_event(1, title=None), "null:title"),
        (make_event(1, namespace="zero"), "type:namespace"),
        (make_event(1, type="flow"), "domain:change_type"),
        (make_event(1, bot=None), "null:is_bot"),
        (make_event(1, meta={"id": "c", "dt": "2026-11-11T16:05:00Z", "domain": "canary"}), "filtered:domain"),
        (make_event(1, meta={"id": "x", "dt": "yesterday", "domain": "en.wikipedia.org"}), "type:event_ts"),
    ],
)
def test_bad_rows_go_to_quarantine_with_a_reason(spark, contract, tmp_path, event, reason):
    lake = Lake(tmp_path / "lake")
    out = land(spark, contract, lake, tmp_path, [make_event(9), event])
    result, good, bad = silver.build(spark, lake, contract, out["hours"], T0)
    assert result.rejects_by_reason == {reason: 1}
    assert good.count() == 1 and bad.first()["reason"] == reason


def test_silver_is_typed_and_deduplicated(spark, contract, tmp_path):
    lake = Lake(tmp_path / "lake")
    land(spark, contract, lake, tmp_path, [make_event(1), make_event(2), make_event(1)], "r1")
    out = land(spark, contract, lake, tmp_path, [make_event(2), make_event(3)], "r2")
    result, good, _ = silver.build(spark, lake, contract, out["hours"], T0)
    assert (result.bronze_rows, result.silver_rows, result.duplicates) == (5, 3, 2)
    row = good.where("event_id = 'evt-1'").first()
    assert row["_run_id"] == "r1"  # the earliest copy wins
    assert isinstance(row["namespace"], int) and row["event_ts"] is not None and row["is_bot"] is False


def test_unknown_fields_are_kept_in_extras(spark, contract, tmp_path):
    lake = Lake(tmp_path / "lake")
    out = land(spark, contract, lake, tmp_path, [make_event(1, experiment_flag=True, rollout={"pct": 5})])
    _, good, _ = silver.build(spark, lake, contract, out["hours"], T0)
    extras = good.first()["extras"]
    assert extras["experiment_flag"] == "true"
    assert json.loads(extras["rollout"]) == {"pct": 5}


def test_too_many_rejects_fail_the_contract_before_writing(spark, contract, tmp_path):
    lake = Lake(tmp_path / "lake")
    out = land(spark, contract, lake, tmp_path, [make_event(1), "x", "y"])
    result, good, bad = silver.build(spark, lake, contract, out["hours"], T0)
    with pytest.raises(ContractViolation, match="rejected, above the contract's limit"):
        silver.write(spark, lake, contract, result, good, bad)
    assert not lake.exists(spark, contract.silver)


def test_gold_aggregates(spark, contract, tmp_path):
    lake = Lake(tmp_path / "lake")
    events = [
        make_event(1, bot=True, length={"old": 100, "new": 160}),
        make_event(2, wiki="dewiki", length={"old": 500, "new": 400}),
        make_event(3, type="new", length={"old": None, "new": 80}, revision={"old": None, "new": 5}),
        make_event(4, title="Page 1"),
        make_event(5, type="log", length=None, revision=None),  # not an edit
    ]
    out = land(spark, contract, lake, tmp_path, events)
    result, good, bad = silver.build(spark, lake, contract, out["hours"], T0)
    silver.write(spark, lake, contract, result, good, bad)
    tables = gold.build(contract, lake.read(spark, contract.silver))
    per_wiki = {r["wiki"]: r.asDict() for r in tables["gold.edits_per_wiki_hour"].collect()}
    assert (
        per_wiki["enwiki"]["edits"] == 3
        and per_wiki["enwiki"]["new_pages"] == 1
        and per_wiki["enwiki"]["bot_edits"] == 1
    )
    assert per_wiki["enwiki"]["bytes_added"] == 60 + 80 + 50 and per_wiki["dewiki"]["bytes_removed"] == 100
    share = tables["gold.bot_share_hour"].first()
    assert (share["edits"], share["bot_edits"], share["human_edits"], share["bot_share"]) == (4, 1, 3, 0.25)
    top = tables["gold.top_pages_hour"].orderBy("rank").first()
    assert (top["title"], top["edits"], top["rank"]) == ("Page 1", 2, 1)
