"""One pipeline run, start to finish, recorded stage by stage in a run report.

    extract -> bronze -> schema -> silver -> gold -> quality -> retention

Every stage is timed and counted. If a stage raises (a contract violation, an
unreachable source), the run stops there, the remaining stages are marked skipped, and
the report is still written: a failed run is as visible as a good one.
"""

from __future__ import annotations

import json
import time
import traceback
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

from . import bronze, evolution, gold, quality, silver, source
from .contracts import Contracts, ContractViolation
from .lake import Lake
from .report import Report, code_info, publish

STAGES = ["extract", "bronze", "schema", "silver", "gold", "quality", "retention"]


def new_run_id(now: datetime) -> str:
    return now.strftime("%Y%m%dT%H%M%SZ")


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


@dataclass
class Options:
    trigger: str = "manual"  # schedule | manual | fixture | replay | rerun | backfill
    sample_seconds: float = 120
    max_events: int = 10_000
    stream_url: str = source.STREAM_URL
    fixture: Path | None = None
    replay: str | None = None  # run id whose landing file to load again
    hours: list[str] | None = None  # rerun / backfill: partitions to rebuild from bronze
    keep_hours: int = 72  # lake retention; run reports are kept 30 days separately
    lake_restored: bool | None = None  # set by CI: whether the lake came back from cache


class Runner:
    def __init__(self, spark: SparkSession, lake: Lake, contracts: Contracts, reports: Path | None):
        self.spark, self.lake, self.contracts, self.reports = spark, lake, contracts, reports

    @contextmanager
    def _stage(self, report: Report, name: str) -> Iterator[dict]:
        st = report.stage(name)
        st.started_at = iso(datetime.now(timezone.utc))
        t0 = time.monotonic()
        info: dict = {}
        try:
            yield info
        except Exception:
            st.status = "failed"
            raise
        else:
            st.status = "ok"
        finally:
            st.duration_s = round(time.monotonic() - t0, 2)
            st.rows_in = info.pop("rows_in", st.rows_in)
            st.rows_out = info.pop("rows_out", st.rows_out)
            st.detail.update(info)

    def run(self, opts: Options, now: datetime | None = None) -> Report:
        now = now or datetime.now(timezone.utc)
        report = Report(run_id=new_run_id(now), trigger=opts.trigger, started_at=iso(now), code=code_info())
        for name in STAGES:
            report.stage(name)
        t0 = time.monotonic()
        try:
            self._run(report, opts, now)
        except Exception as e:
            failed = next((s for s in report.stages if s.status == "failed"), None)
            report.error = {
                "stage": failed.name if failed else None,
                "type": type(e).__name__,
                "message": str(e).splitlines()[0][:500] if str(e) else type(e).__name__,
                "contract": getattr(e, "contract", None),
            }
            if not isinstance(e, ContractViolation | source.SourceUnavailable):
                report.error["trace"] = traceback.format_exc(limit=4)[-2000:]
        for s in report.stages:
            if s.status == "pending":
                s.status = "skipped"
        report.finished_at = iso(datetime.now(timezone.utc))
        report.duration_s = round(time.monotonic() - t0, 2)
        report.status = _status(report)
        report.lake.update({"keep_hours": opts.keep_hours, "restored_from_cache": opts.lake_restored})
        if self.reports:
            publish(report, self.reports, now)
        return report

    def _run(self, report: Report, opts: Options, now: datetime) -> None:
        spark, lake, contracts = self.spark, self.lake, self.contracts
        rerun = opts.hours is not None
        landed: int | None = None

        if rerun:
            for name in ("extract", "bronze", "schema"):
                st = report.stage(name)
                st.status, st.detail = "skipped", {"reason": f"{opts.trigger}: rebuilding partitions from bronze"}
            hours = sorted(set(opts.hours or []))
            existing = set(r[0] for r in lake.read(spark, contracts.bronze).select("event_hour").distinct().collect())
            missing = [h for h in hours if h not in existing]
            hours = [h for h in hours if h in existing]
            report.source = {"kind": "bronze", "requested_hours": len(opts.hours or []), "missing_in_bronze": missing}
        else:
            # a replay re-reads an earlier run's landing file and lands it under that run's id,
            # so bronze stays append-only and the replay adds nothing twice
            batch_id = opts.replay or report.run_id
            landing = lake.landing / f"{batch_id}.jsonl"
            with self._stage(report, "extract") as info:
                if opts.replay:
                    if not landing.exists():
                        raise source.SourceUnavailable(f"no landing file for run {opts.replay}")
                    lines = landing.read_text(encoding="utf-8").splitlines()
                    sample = source.Sample(landing, f"replay:{opts.replay}", len(lines), sum(map(len, lines)), 0.0)
                elif opts.fixture:
                    sample = source.from_file(opts.fixture, landing)
                else:
                    sample = source.sample_stream(landing, opts.sample_seconds, opts.max_events, opts.stream_url)
                report.source = {
                    "kind": "wikimedia" if sample.source.startswith("http") else sample.source.split(":")[0],
                    "url": sample.source,
                    "sample_seconds": sample.seconds,
                    "events": sample.events,
                    "bytes": sample.bytes,
                }
                info.update(rows_out=sample.events)

            with self._stage(report, "bronze") as info:
                ingested_at = datetime.now(timezone.utc)
                df = bronze.read_landing(spark, landing, batch_id, sample.source, ingested_at)
                out = bronze.land(spark, lake, contracts, df, batch_id)
                # a replayed run is already in bronze: nothing new lands, and that is correct
                landed = None if out["already_landed"] else out["rows_out"]
                report.rows["landed"] = out["rows_out"]
                hours = out["hours"]
                info.update(
                    rows_in=out["rows_in"], rows_out=out["rows_out"], already_landed=out["already_landed"], hours=hours
                )
                window = df.agg(F.min("event_ts"), F.max("event_ts")).first()
                report.source.update({"window_start": _iso_or_none(window[0]), "window_end": _iso_or_none(window[1])})

            with self._stage(report, "schema") as info:
                lines = landing.read_text(encoding="utf-8").splitlines()
                registry = evolution.load_registry(lake.registry, contracts.known_fields)
                changes, updated = evolution.detect(lines, registry, report.run_id)
                evolution.save_registry(lake.registry, updated, report.run_id)
                report.schema_changes = [c.as_dict() for c in changes]
                if changes:
                    _append_json(spark, lake, "ops/schema_changes", report.schema_changes, now)
                info.update(rows_in=len(lines), changes=len(changes), fields_tracked=len(updated))

        report.partitions = hours
        if not hours:
            raise ContractViolation(contracts.bronze.name, "no bronze partitions to process")

        result = None
        with self._stage(report, "silver") as info:
            result, silver_df, bad_df = silver.build(spark, lake, contracts, hours, datetime.now(timezone.utc))
            report.rows.update(
                {
                    "bronze": result.bronze_rows,
                    "silver": result.silver_rows,
                    "quarantine": result.quarantined,
                    "duplicates": result.duplicates,
                }
            )
            report.rejects = {
                "total": result.quarantined,
                "rate": round(result.reject_rate, 4),
                "by_reason": result.rejects_by_reason,
                "samples": result.reject_samples,
            }
            info.update(
                rows_in=result.bronze_rows,
                rows_out=result.silver_rows,
                quarantined=result.quarantined,
                duplicates=result.duplicates,
            )
            report.contract_notes += silver.write(spark, lake, contracts, result, silver_df, bad_df)
            report.samples = silver.sample_rows(silver_df)

        with self._stage(report, "gold") as info:
            silver_hours = lake.read_hours(spark, contracts.silver, hours)
            tables = gold.build(contracts, silver_hours)
            rows = gold.write(spark, lake, contracts, tables, hours)
            info.update(rows_in=result.silver_rows, rows_out=sum(rows.values()), tables=rows)
            report.gold = self._gold_summary(hours)

        with self._stage(report, "quality") as info:
            live = opts.trigger in ("schedule", "manual") and not opts.fixture and not opts.replay and not rerun
            checks = quality.run_checks(spark, lake, contracts, result, landed, live, now)
            report.dq = [c.as_dict() for c in checks]
            quality.save(spark, lake, checks, report.run_id, now)
            info.update(checks=len(checks), failed=sum(c.status == "fail" for c in checks))

        with self._stage(report, "retention") as info:
            info.update(rows_deleted=lake.prune(spark, contracts, opts.keep_hours, now), keep_hours=opts.keep_hours)
            report.lake.update(self._lake_totals())

    def _gold_summary(self, hours: list[str]) -> dict:
        spark, lake, c = self.spark, self.lake, self.contracts
        g = {t.name: lake.read_hours(spark, t, hours) for t in c.gold}
        share = g["gold.bot_share_hour"].agg(F.sum("edits"), F.sum("bot_edits")).first()
        edits_total, bots = (share[0] or 0), (share[1] or 0)
        wikis = (
            g["gold.edits_per_wiki_hour"]
            .groupBy("wiki")
            .agg(F.sum("edits").alias("edits"))
            .orderBy(F.desc("edits"), "wiki")
            .limit(5)
            .collect()
        )
        pages = (
            g["gold.top_pages_hour"]
            .groupBy("wiki", "title")
            .agg(F.sum("edits").alias("edits"))
            .orderBy(F.desc("edits"), "wiki", "title")
            .limit(5)
            .collect()
        )
        return {
            "edits": int(edits_total),
            "bot_share": round(bots / edits_total, 4) if edits_total else None,
            "top_wikis": [{"wiki": r["wiki"], "edits": int(r["edits"])} for r in wikis],
            "top_pages": [{"wiki": r["wiki"], "title": r["title"], "edits": int(r["edits"])} for r in pages],
            "note": "Counts cover the sampled window of each hour, not the whole hour.",
        }

    def _lake_totals(self) -> dict:
        spark, lake, c = self.spark, self.lake, self.contracts
        return {t.name: lake.read(spark, t).count() for t in [c.bronze, c.silver, c.quarantine, *c.gold]}


def _status(report: Report) -> str:
    if report.error or any(c["status"] == "fail" for c in report.dq):
        return "failed"
    if any(c["status"] == "warn" for c in report.dq):
        return "warned"
    return "passed"


def _iso_or_none(dt: datetime | None) -> str | None:
    return None if dt is None else iso(dt.replace(tzinfo=timezone.utc))


def _append_json(spark: SparkSession, lake: Lake, path: str, rows: list[dict], at: datetime) -> None:
    data = [(at, json.dumps(r, default=str)) for r in rows]
    spark.createDataFrame(data, "recorded_at timestamp, change string").write.format("delta").mode("append").save(
        lake.path(path)
    )
