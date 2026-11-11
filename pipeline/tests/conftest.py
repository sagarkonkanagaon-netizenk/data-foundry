import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from foundry import contracts
from foundry.spark import get_spark

FIXTURE = Path(__file__).resolve().parent.parent / "fixtures" / "recentchange_sample.jsonl"
# "now" for runs over the fixture: just after its last event
FIXTURE_NOW = datetime(2026, 11, 11, 17, 25, tzinfo=timezone.utc)


@pytest.fixture(scope="session")
def spark():
    s = get_spark("tests")
    yield s
    s.stop()


@pytest.fixture(scope="session")
def contract():
    return contracts.load()


def make_event(i: int, **over) -> dict:
    """A minimal valid recentchange event; keyword arguments override fields."""
    e = {
        "$schema": "/mediawiki/recentchange/1.0.0",
        "meta": {
            "id": f"evt-{i}",
            "dt": "2026-11-11T16:05:00Z",
            "domain": "en.wikipedia.org",
            "stream": "mediawiki.recentchange",
        },
        "type": "edit",
        "namespace": 0,
        "title": f"Page {i}",
        "bot": False,
        "wiki": "enwiki",
        "minor": False,
        "length": {"old": 100, "new": 150},
        "revision": {"old": 1, "new": 2},
    }
    for k, v in over.items():
        if v is None:
            e.pop(k, None)
        else:
            e[k] = v
    return e


def write_lines(path: Path, events: list) -> Path:
    path.write_text("\n".join(e if isinstance(e, str) else json.dumps(e) for e in events) + "\n", encoding="utf-8")
    return path
