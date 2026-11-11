"""Generate recentchange_sample.jsonl: a deterministic, SYNTHETIC sample of events.

The live stream is the real source; this file exists so tests and local runs work
offline. Each event follows the upstream schema mediawiki/recentchange 1.0.0
(github.com/wikimedia/mediawiki-event-schemas). The values are made up. A handful of
deliberately bad lines are appended so every quarantine reason and the schema-change
path are exercised.

    python fixtures/make_fixture.py
"""

from __future__ import annotations

import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT = Path(__file__).with_name("recentchange_sample.jsonl")
START = datetime(2026, 11, 11, 16, 40, tzinfo=timezone.utc)
SPAN_S = 40 * 60  # crosses the 17:00 hour boundary, so two partitions

WIKIS = [
    ("enwiki", "en.wikipedia.org", 0.36),
    ("wikidatawiki", "www.wikidata.org", 0.26),
    ("commonswiki", "commons.wikimedia.org", 0.12),
    ("dewiki", "de.wikipedia.org", 0.08),
    ("frwiki", "fr.wikipedia.org", 0.07),
    ("eswiki", "es.wikipedia.org", 0.06),
    ("jawiki", "ja.wikipedia.org", 0.05),
]
TITLES = [
    "Apache Spark",
    "Delta Lake",
    "Bengaluru",
    "Data engineering",
    "Lakehouse",
    "Hadoop",
    "Stream processing",
    "Extract, transform, load",
    "Parquet",
    "Data quality",
    "Q42",
    "Q64",
    "File:Sunset.jpg",
    "Category:Rivers",
]
USERS = ["ExampleEditor", "AnotherEditor", "Sample-bot", "WikiGnome", "203.0.113.7", "ReviewerX"]


def pick(rng: random.Random, weighted: list[tuple]) -> tuple:
    r, acc = rng.random(), 0.0
    for item in weighted:
        acc += item[-1]
        if r <= acc:
            return item
    return weighted[-1]


def event(rng: random.Random, i: int) -> dict:
    wiki, host, _ = pick(rng, WIKIS)
    dt = START + timedelta(seconds=rng.uniform(0, SPAN_S))
    kind = pick(rng, [("edit", 0.74), ("new", 0.05), ("log", 0.10), ("categorize", 0.11)])[0]
    bot = rng.random() < (0.7 if wiki == "wikidatawiki" else 0.12)
    title = rng.choice(TITLES)
    e = {
        "$schema": "/mediawiki/recentchange/1.0.0",
        "meta": {
            "uri": f"https://{host}/wiki/{title.replace(' ', '_')}",
            "request_id": str(uuid.UUID(int=rng.getrandbits(128))),
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "dt": dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z",
            "domain": host,
            "stream": "mediawiki.recentchange",
            "topic": "eqiad.mediawiki.recentchange",
            "partition": 0,
            "offset": 5_000_000_000 + i,
        },
        "id": 1_700_000_000 + i,
        "type": kind,
        "namespace": 0 if kind != "log" else -1,
        "title": title,
        "title_url": f"https://{host}/wiki/{title.replace(' ', '_')}",
        "comment": "synthetic fixture event",
        "timestamp": int(dt.timestamp()),
        "user": "Sample-bot" if bot else rng.choice(USERS),
        "bot": bot,
        "notify_url": f"https://{host}/w/index.php?diff={9_000_000 + i}",
        "server_url": f"https://{host}",
        "server_name": host,
        "server_script_path": "/w",
        "wiki": wiki,
        "parsedcomment": "synthetic fixture event",
    }
    if kind in ("edit", "new"):
        old = None if kind == "new" else rng.randint(200, 90_000)
        new = rng.randint(50, 600) if kind == "new" else max(0, old + rng.randint(-400, 900))
        e.update(
            {
                "minor": rng.random() < 0.2,
                "patrolled": rng.random() < 0.5,
                "length": {"old": old, "new": new},
                "revision": {"old": None if kind == "new" else 1_200_000_000 + i, "new": 1_200_000_001 + i},
            }
        )
    elif kind == "log":
        e.update(
            {
                "log_id": 160_000_000 + i,
                "log_type": rng.choice(["upload", "move", "patrol", "newusers"]),
                "log_action": "create",
                "log_params": {"auto": 1} if rng.random() < 0.5 else [],
                "log_action_comment": "synthetic fixture event",
            }
        )
    return e


def main() -> None:
    rng = random.Random(20261111)
    events = [event(rng, i) for i in range(600)]
    events.sort(key=lambda e: e["meta"]["dt"])
    lines = [json.dumps(e, ensure_ascii=False) for e in events]

    # deliberately bad or unusual lines, one per path the pipeline must handle
    lines += [lines[i] for i in (10, 11, 200, 201, 202, 590)]  # 6 redelivered duplicates
    lines.append(lines[50][:120])  # truncated JSON
    lines.append("not json at all")  # garbage line
    canary = json.loads(lines[60])
    canary["meta"]["id"] = "canary-1"
    canary["meta"]["domain"] = "canary"
    lines.append(json.dumps(canary))  # monitoring event
    for n, i in enumerate((70, 71)):  # missing title
        e = json.loads(lines[i])
        e["meta"]["id"] = f"no-title-{n}"
        del e["title"]
        lines.append(json.dumps(e))
    e = json.loads(lines[80])
    e["meta"]["id"] = "bad-namespace"
    e["namespace"] = "zero"
    lines.append(json.dumps(e))  # wrong type for a known field
    e = json.loads(lines[90])
    e["meta"]["id"] = "unknown-type"
    e["type"] = "flow"
    lines.append(json.dumps(e))  # value outside accepted_values
    for n, i in enumerate((100, 300, 500)):  # a field the contract doesn't know
        e = json.loads(lines[i])
        e["meta"]["id"] = f"new-field-{n}"
        e["experiment_flag"] = True
        lines.append(json.dumps(e))

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {len(lines)} lines to {OUT}")


if __name__ == "__main__":
    main()
