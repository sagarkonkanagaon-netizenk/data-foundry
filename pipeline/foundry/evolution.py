"""Schema evolution: notice new or changed fields, record them, keep running.

The registry holds every field path seen so far (top level and one level down, such as
`meta.domain`) with the JSON types it has taken. It starts from the upstream schema
listed in contracts/bronze.yaml. Each run compares its events against it:

- a field never seen before is recorded as `added`
- a known field arriving with a new JSON type is recorded as `type_widened`

Neither stops the run. New top-level fields flow into silver's `extras` column, so
nothing is lost and no code changes. A known field whose new type no longer casts to its
contract type sends that row to quarantine (`type:<column>`), where it can be seen.
A field missing from a sample is not recorded: many fields are optional, so absence in a
few minutes of traffic says nothing about the schema.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass
class SchemaChange:
    kind: str  # added | type_widened
    field: str
    types: list[str]
    previous: list[str]
    count: int  # events in this run that carried it
    example_event_id: str | None
    run_id: str

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def json_type(v: Any) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, int):
        return "integer"
    if isinstance(v, float):
        return "number"
    if isinstance(v, str):
        return "string"
    if isinstance(v, list):
        return "array"
    return "object"


def observe(lines: list[str], registry: dict[str, list[str]] | None = None) -> dict[str, dict[str, Any]]:
    """Field path -> {type: {count, example}} over every valid JSON object in `lines`.

    Nested fields are followed one level down, only inside fields the registry knows as
    plain objects (meta, length, revision). Free-form fields such as log_params, whose
    shape varies by log type, are tracked as a whole.
    """
    registry = registry or {}
    seen: dict[str, dict[str, Any]] = {}

    def note(path: str, value: Any, eid: str | None) -> None:
        t = seen.setdefault(path, {}).setdefault(json_type(value), {"count": 0, "example": eid})
        t["count"] += 1

    for line in lines:
        try:
            e = json.loads(line)
        except ValueError:
            continue
        if not isinstance(e, dict):
            continue
        meta = e.get("meta")
        eid = meta.get("id") if isinstance(meta, dict) else None
        for k, v in e.items():
            note(k, v, eid)
            if isinstance(v, dict) and registry.get(k) == ["object"]:
                for k2, v2 in v.items():
                    note(f"{k}.{k2}", v2, eid)
    return seen


def load_registry(path: Path, known_fields: dict[str, list[str]]) -> dict[str, list[str]]:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))["fields"]
    return {k: sorted(v) for k, v in known_fields.items()}


def save_registry(path: Path, fields: dict[str, list[str]], run_id: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"updated_by_run": run_id, "fields": dict(sorted(fields.items()))}, indent=1), encoding="utf-8"
    )


def detect(
    lines: list[str], registry: dict[str, list[str]], run_id: str
) -> tuple[list[SchemaChange], dict[str, list[str]]]:
    """Compare a run's events with the registry; returns the changes and the updated registry."""
    changes: list[SchemaChange] = []
    updated = {k: list(v) for k, v in registry.items()}
    for path, by_type in sorted(observe(lines, registry).items()):
        types = sorted(by_type)
        known = registry.get(path)
        if known is None:
            first = next(iter(by_type.values()))
            count = sum(t["count"] for t in by_type.values())
            changes.append(SchemaChange("added", path, types, [], count, first["example"], run_id))
            updated[path] = types
            continue
        new = sorted(set(types) - set(known) - {"null"})
        if new:
            count = sum(by_type[t]["count"] for t in new)
            example = by_type[new[0]]["example"]
            changes.append(
                SchemaChange("type_widened", path, sorted(set(known) | set(new)), known, count, example, run_id)
            )
            updated[path] = sorted(set(known) | set(new))
    return changes, updated
