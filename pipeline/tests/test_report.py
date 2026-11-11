import json
from datetime import datetime, timedelta, timezone

from foundry.report import Report, publish


def test_history_keeps_thirty_days_newest_first(tmp_path):
    now = datetime(2026, 12, 31, 12, tzinfo=timezone.utc)
    for days_ago in (40, 31, 29, 1, 0):
        t = now - timedelta(days=days_ago)
        r = Report(run_id=t.strftime("%Y%m%dT%H%M%SZ"), trigger="schedule", started_at=t.isoformat(), status="passed")
        publish(r, tmp_path, now)
    index = json.loads((tmp_path / "index.json").read_text())
    started = [r["started_at"][:10] for r in index["runs"]]
    assert started == ["2026-12-31", "2026-12-30", "2026-12-02"]
    assert sorted(p.name for p in (tmp_path / "runs").iterdir()) == ["2026-12-02", "2026-12-30", "2026-12-31"]
    assert json.loads((tmp_path / "latest.json").read_text())["run_id"].startswith("20261231")
