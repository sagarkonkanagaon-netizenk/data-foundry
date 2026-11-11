"""End to end over the fixture: runs, replays, re-runs, backfills and failures."""

import json
from datetime import datetime, timezone

import pytest

from foundry.lake import Lake
from foundry.run import Options, Runner
from tests.conftest import FIXTURE, FIXTURE_NOW, make_event, write_lines


def counts(spark, contract, lake):
    out = {
        t.name: lake.read(spark, t).count()
        for t in [contract.bronze, contract.silver, contract.quarantine, *contract.gold]
    }
    out["edits"] = (
        lake.read(spark, next(t for t in contract.gold if t.name == "gold.bot_share_hour"))
        .groupBy()
        .sum("edits")
        .first()[0]
    )
    return out


@pytest.fixture(scope="module")
def first_run(spark, contract, tmp_path_factory):
    root = tmp_path_factory.mktemp("e2e")
    lake, reports = Lake(root / "lake"), root / "reports"
    runner = Runner(spark, lake, contract, reports)
    report = runner.run(Options(trigger="fixture", fixture=FIXTURE), now=FIXTURE_NOW)
    return runner, lake, reports, report


def test_fixture_run_passes_every_stage(first_run):
    _, _, _, r = first_run
    assert r.status == "passed", r.error
    assert [s.name for s in r.stages] == ["extract", "bronze", "schema", "silver", "gold", "quality", "retention"]
    assert all(s.status == "ok" for s in r.stages)
    assert r.rows == {"landed": 616, "bronze": 616, "silver": 603, "quarantine": 7, "duplicates": 6}
    assert r.rejects["by_reason"] == {
        "domain:change_type": 1,
        "filtered:domain": 1,
        "malformed_json": 2,
        "null:title": 2,
        "type:namespace": 1,
    }
    assert {(c["kind"], c["field"]) for c in r.schema_changes} == {
        ("added", "experiment_flag"),
        ("type_widened", "namespace"),
    }
    assert {c["check"] for c in r.dq if c["status"] == "pass"} >= {
        "row_count",
        "null_rate",
        "unique",
        "reconciliation",
        "reject_rate",
    }
    assert r.gold["edits"] > 0 and 0 < r.gold["bot_share"] < 1
    assert len(r.samples) == 12 and {"event_id", "wiki", "title", "change_type"} <= set(r.samples[0])
    assert r.samples[0]["event_ts"].endswith("Z")


def test_report_is_published(first_run):
    _, _, reports, r = first_run
    latest = json.loads((reports / "latest.json").read_text())
    index = json.loads((reports / "index.json").read_text())
    assert latest["run_id"] == r.run_id and index["runs"][0]["run_id"] == r.run_id
    assert (reports / index["runs"][0]["path"]).exists()


def test_running_the_same_data_again_changes_nothing_downstream(first_run, spark, contract):
    runner, lake, _, _ = first_run
    before = counts(spark, contract, lake)
    r = runner.run(Options(trigger="fixture", fixture=FIXTURE), now=FIXTURE_NOW.replace(minute=40))
    after = counts(spark, contract, lake)
    assert r.status == "passed", r.error
    assert after["bronze.recentchange"] == 2 * before["bronze.recentchange"]  # bronze is append-only
    for k in before:
        if k != "bronze.recentchange":
            assert after[k] == before[k], k
    assert r.rows["duplicates"] == 6 + 616  # every row of the second copy is a duplicate
    assert r.schema_changes == []  # already in the registry


def test_rerun_and_backfill_are_idempotent(first_run, spark, contract):
    runner, lake, _, _ = first_run
    before = counts(spark, contract, lake)
    r1 = runner.run(Options(trigger="rerun", hours=["2026-11-11T16"]), now=FIXTURE_NOW)
    r2 = runner.run(
        Options(trigger="backfill", hours=["2026-11-11T15", "2026-11-11T16", "2026-11-11T17"]), now=FIXTURE_NOW
    )
    r3 = runner.run(
        Options(trigger="backfill", hours=["2026-11-11T15", "2026-11-11T16", "2026-11-11T17"]), now=FIXTURE_NOW
    )
    for r in (r1, r2, r3):
        assert r.status == "passed", r.error
        assert [s.status for s in r.stages[:3]] == ["skipped"] * 3
    assert r2.source["missing_in_bronze"] == ["2026-11-11T15"]
    assert counts(spark, contract, lake) == before


def test_a_contract_violation_stops_the_run_and_is_reported(spark, contract, tmp_path):
    runner = Runner(spark, Lake(tmp_path / "lake"), contract, tmp_path / "reports")
    bad = write_lines(tmp_path / "bad.jsonl", [make_event(1)] + [f"garbage {i}" for i in range(3)])
    r = runner.run(Options(trigger="fixture", fixture=bad), now=datetime(2026, 11, 11, 16, 30, tzinfo=timezone.utc))
    assert r.status == "failed"
    assert r.error["stage"] == "silver" and r.error["type"] == "ContractViolation"
    assert [s.status for s in r.stages] == ["ok", "ok", "ok", "failed", "skipped", "skipped", "skipped"]
    assert json.loads((tmp_path / "reports" / "latest.json").read_text())["status"] == "failed"


def test_an_unreachable_source_is_a_failed_run(spark, contract, tmp_path, monkeypatch):
    from foundry import source

    def down(*a, **k):
        raise source.SourceUnavailable("could not sample: 403")

    monkeypatch.setattr(source, "sample_stream", down)
    r = Runner(spark, Lake(tmp_path / "lake"), contract, None).run(Options(trigger="schedule"))
    assert r.status == "failed" and r.error["stage"] == "extract" and "403" in r.error["message"]
