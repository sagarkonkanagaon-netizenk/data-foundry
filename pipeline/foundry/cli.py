"""Command line: `foundry run`, `foundry rerun`, `foundry backfill`.

foundry run                         sample the live stream for 2 minutes and run every stage
foundry run --fixture FILE          same, from a recorded file instead of the stream
foundry run --replay RUN_ID         load an earlier run's landing file again (a no-op for bronze)
foundry rerun --hour 2026-11-11T18  rebuild silver and gold for one or more hours from bronze
foundry backfill --start 2026-11-10T00 --end 2026-11-11T23
                                    rebuild every hour in a range; safe to run twice
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from . import contracts as contracts_mod
from .lake import Lake
from .run import Options, Runner


def _hour(s: str) -> datetime:
    return datetime.strptime(s, "%Y-%m-%dT%H").replace(tzinfo=timezone.utc)


def hours_between(start: str, end: str) -> list[str]:
    a, b = _hour(start), _hour(end)
    if b < a:
        raise SystemExit("--end is before --start")
    out = []
    while a <= b:
        out.append(a.strftime("%Y-%m-%dT%H"))
        a += timedelta(hours=1)
    return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="foundry", description="The Data Foundry pipeline")
    p.add_argument("--lake", default=os.environ.get("FOUNDRY_LAKE", "lake"), help="lake directory (default ./lake)")
    p.add_argument(
        "--reports", default=os.environ.get("FOUNDRY_REPORTS", "reports"), help="where run reports are written"
    )
    p.add_argument("--contracts", default=None, help="contracts directory (default: pipeline/contracts)")
    p.add_argument("--keep-hours", type=int, default=72, help="lake retention in hours (default 72)")
    p.add_argument("--lake-restored", choices=["true", "false"], help="set by CI: did the lake come back from cache")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="extract a sample and run every stage")
    r.add_argument("--sample-seconds", type=float, default=120)
    r.add_argument("--max-events", type=int, default=10_000)
    r.add_argument("--trigger", default="manual", choices=["schedule", "manual"])
    src = r.add_mutually_exclusive_group()
    src.add_argument("--fixture", type=Path)
    src.add_argument("--replay", metavar="RUN_ID")

    rr = sub.add_parser("rerun", help="rebuild silver and gold for given hours from bronze")
    rr.add_argument("--hour", action="append", required=True, help="yyyy-MM-ddTHH (UTC); repeatable")

    bf = sub.add_parser("backfill", help="rebuild silver and gold for every hour in a range")
    bf.add_argument("--start", required=True, help="yyyy-MM-ddTHH (UTC)")
    bf.add_argument("--end", required=True, help="yyyy-MM-ddTHH (UTC), inclusive")

    a = p.parse_args(argv)
    if a.cmd == "run":
        trigger = "fixture" if a.fixture else "replay" if a.replay else a.trigger
        opts = Options(
            trigger=trigger,
            sample_seconds=a.sample_seconds,
            max_events=a.max_events,
            fixture=a.fixture,
            replay=a.replay,
        )
    elif a.cmd == "rerun":
        for h in a.hour:
            _hour(h)
        opts = Options(trigger="rerun", hours=a.hour)
    else:
        opts = Options(trigger="backfill", hours=hours_between(a.start, a.end))
    opts.keep_hours = a.keep_hours
    if a.lake_restored:
        opts.lake_restored = a.lake_restored == "true"

    from .spark import get_spark  # imported late so --help works without Java

    spark = get_spark()
    runner = Runner(spark, Lake(Path(a.lake)), contracts_mod.load(a.contracts), Path(a.reports))
    report = runner.run(opts)
    print(json.dumps(report.summary(), indent=1))
    for s in report.stages:
        print(
            f"  {s.name:<10} {s.status:<8} {s.duration_s or 0:>7.2f}s  in={s.rows_in} out={s.rows_out}", file=sys.stderr
        )
    for c in report.dq:
        print(f"  dq {c['status']:<5} {c['check']:<15} {c['target']:<32} observed={c['observed']}", file=sys.stderr)
    if report.error:
        print(f"  ERROR in {report.error['stage']}: {report.error['message']}", file=sys.stderr)
    return 1 if report.status == "failed" else 0


if __name__ == "__main__":
    raise SystemExit(main())
