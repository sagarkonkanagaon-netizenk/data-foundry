"""Run reports: one small JSON per run, plus an index of the last 30 days.

Layout under the reports directory (published to the `pipeline-data` branch):

    latest.json                    the newest run, in full
    index.json                     one summary line per run, newest first, last 30 days
    runs/YYYY-MM-DD/<run_id>.json  every run in full, last 30 days
"""

from __future__ import annotations

import json
import os
import shutil
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1
KEEP_DAYS = 30


@dataclass
class Stage:
    name: str
    status: str = "pending"  # pending | ok | failed | skipped
    started_at: str | None = None
    duration_s: float | None = None
    rows_in: int | None = None
    rows_out: int | None = None
    detail: dict[str, Any] = field(default_factory=dict)


@dataclass
class Report:
    run_id: str
    trigger: str  # schedule | manual | rerun | backfill | fixture
    started_at: str
    status: str = "running"  # passed | warned | failed
    finished_at: str | None = None
    duration_s: float | None = None
    source: dict[str, Any] = field(default_factory=dict)
    partitions: list[str] = field(default_factory=list)
    stages: list[Stage] = field(default_factory=list)
    rows: dict[str, int] = field(default_factory=dict)
    rejects: dict[str, Any] = field(default_factory=dict)
    samples: list[dict[str, Any]] = field(default_factory=list)  # a few silver rows, for the site's hover cards
    dq: list[dict[str, Any]] = field(default_factory=list)
    schema_changes: list[dict[str, Any]] = field(default_factory=list)
    contract_notes: list[str] = field(default_factory=list)
    gold: dict[str, Any] = field(default_factory=dict)
    lake: dict[str, Any] = field(default_factory=dict)
    error: dict[str, Any] | None = None
    code: dict[str, Any] = field(default_factory=dict)
    schema_version: int = SCHEMA_VERSION

    def stage(self, name: str) -> Stage:
        for s in self.stages:
            if s.name == name:
                return s
        s = Stage(name)
        self.stages.append(s)
        return s

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)

    def summary(self) -> dict[str, Any]:
        dq_failed = sum(1 for c in self.dq if c["status"] == "fail")
        dq_warned = sum(1 for c in self.dq if c["status"] == "warn")
        return {
            "run_id": self.run_id,
            "trigger": self.trigger,
            "status": self.status,
            "started_at": self.started_at,
            "duration_s": self.duration_s,
            "partitions": self.partitions,
            "rows_in": self.rows.get("landed"),
            "rows_out": self.rows.get("silver"),
            "rejects": self.rejects.get("total", 0),
            "duplicates": self.rows.get("duplicates"),
            "dq_failed": dq_failed,
            "dq_warned": dq_warned,
            "schema_changes": len(self.schema_changes),
            "error": (self.error or {}).get("message"),
            "path": f"runs/{self.started_at[:10]}/{self.run_id}.json",
        }


def code_info() -> dict[str, Any]:
    """Which commit ran, and a link to the CI run, when running in GitHub Actions."""
    info: dict[str, Any] = {}
    if sha := os.environ.get("GITHUB_SHA"):
        info["commit"] = sha
    if (server := os.environ.get("GITHUB_SERVER_URL")) and (repo := os.environ.get("GITHUB_REPOSITORY")):
        info["repository"] = f"{server}/{repo}"
        if run := os.environ.get("GITHUB_RUN_ID"):
            info["workflow_run"] = f"{server}/{repo}/actions/runs/{run}"
    return info


def publish(report: Report, out: Path, now: datetime | None = None) -> Path:
    """Write the run's JSON, update latest.json and index.json, and drop runs older than 30 days."""
    now = now or datetime.now(timezone.utc)
    out.mkdir(parents=True, exist_ok=True)
    body = json.dumps(report.as_dict(), indent=1, default=str)
    path = out / report.summary()["path"]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body + "\n", encoding="utf-8")
    (out / "latest.json").write_text(body + "\n", encoding="utf-8")

    index_path = out / "index.json"
    runs: list[dict[str, Any]] = []
    if index_path.exists():
        runs = json.loads(index_path.read_text(encoding="utf-8")).get("runs", [])
    runs = [r for r in runs if r["run_id"] != report.run_id] + [report.summary()]
    cutoff = (now - timedelta(days=KEEP_DAYS)).isoformat()
    runs = sorted((r for r in runs if r["started_at"] >= cutoff), key=lambda r: r["started_at"], reverse=True)
    index = {"schema_version": SCHEMA_VERSION, "updated_at": now.isoformat(), "keep_days": KEEP_DAYS, "runs": runs}
    index_path.write_text(json.dumps(index, indent=1) + "\n", encoding="utf-8")

    runs_dir = out / "runs"
    for day in runs_dir.iterdir():
        if day.is_dir() and day.name < cutoff[:10]:
            shutil.rmtree(day)
    return path
