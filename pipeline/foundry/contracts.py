"""Data contracts: one YAML file per layer, loaded and enforced here.

A contract violation raises ContractViolation, which stops the run before the layer
is written. Row-level problems are not violations: those rows go to quarantine.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml
from pyspark.sql import DataFrame
from pyspark.sql import types as T

CONTRACTS_DIR = Path(os.environ.get("FOUNDRY_CONTRACTS", Path(__file__).resolve().parent.parent / "contracts"))

_TYPES: dict[str, T.DataType] = {
    "string": T.StringType(),
    "int": T.IntegerType(),
    "long": T.LongType(),
    "double": T.DoubleType(),
    "boolean": T.BooleanType(),
    "timestamp": T.TimestampType(),
    "map<string,string>": T.MapType(T.StringType(), T.StringType()),
}


class ContractViolation(Exception):
    """The data broke its contract. The run stops and nothing downstream is written."""

    def __init__(self, contract: str, message: str):
        super().__init__(f"{contract}: {message}")
        self.contract = contract
        self.message = message


def spark_type(name: str) -> T.DataType:
    try:
        return _TYPES[name]
    except KeyError as e:
        raise ValueError(f"unknown contract type {name!r}") from e


@dataclass
class Column:
    name: str
    type: str
    nullable: bool = True
    source: str | None = None  # JSON path in the raw event
    accepted_values: list[str] | None = None
    description: str = ""

    @classmethod
    def parse(cls, d: dict[str, Any]) -> Column:
        return cls(
            name=d["name"],
            type=d["type"],
            nullable=d.get("nullable", True),
            source=d.get("from"),
            accepted_values=d.get("accepted_values"),
            description=d.get("description", ""),
        )


@dataclass
class Table:
    name: str
    path: str
    columns: list[Column]
    partition_by: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)

    @property
    def schema(self) -> T.StructType:
        return T.StructType([T.StructField(c.name, spark_type(c.type), True) for c in self.columns])

    def column(self, name: str) -> Column:
        return next(c for c in self.columns if c.name == name)


@dataclass
class Contracts:
    bronze: Table
    silver: Table
    quarantine: Table
    gold: list[Table]
    known_fields: dict[str, list[str]]
    silver_rules: dict[str, Any]

    @property
    def source_columns(self) -> list[Column]:
        """Silver columns read from the raw event, in contract order."""
        return [c for c in self.silver.columns if c.source]


def _read(name: str, base: Path) -> dict[str, Any]:
    with open(base / f"{name}.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load(base: Path | str | None = None) -> Contracts:
    base = Path(base) if base else CONTRACTS_DIR
    b, s, g = _read("bronze", base), _read("silver", base), _read("gold", base)
    bronze = Table(
        b["name"],
        b["path"],
        [Column.parse(c) for c in b["columns"]],
        b.get("partition_by"),
        {"min_rows": b.get("min_rows", 1)},
    )
    silver_cols = [Column.parse(c) for c in s["columns"]] + [Column.parse(c) for c in s["system_columns"]]
    silver = Table(s["name"], s["path"], silver_cols, s.get("partition_by"))
    quarantine = Table(
        s["name"].replace("recentchange", "quarantine"),
        s["quarantine_path"],
        [Column.parse(c) for c in s["quarantine_columns"]],
        "event_hour",
    )
    gold = [
        Table(
            t["name"],
            t["path"],
            [Column.parse(c) for c in t["columns"]],
            t.get("partition_by"),
            {"top_n": t.get("top_n")},
        )
        for t in g["tables"]
    ]
    rules = {k: s[k] for k in ("key", "max_reject_rate", "drop_domains", "quality") if k in s}
    for c in silver.columns:
        spark_type(c.type)  # unknown types fail at load, not mid-run
    return Contracts(bronze, silver, quarantine, gold, b.get("known_fields", {}), rules)


def enforce_schema(df: DataFrame, table: Table) -> DataFrame:
    """Fail fast unless `df` has exactly the contract's columns and types; returns it in contract order."""
    want = {c.name: spark_type(c.type) for c in table.columns}
    have = {f.name: f.dataType for f in df.schema.fields}
    missing = sorted(set(want) - set(have))
    unexpected = sorted(set(have) - set(want))
    wrong = sorted(n for n in set(want) & set(have) if want[n] != have[n])
    problems = []
    if missing:
        problems.append(f"missing columns {missing}")
    if unexpected:
        problems.append(f"columns not in the contract {unexpected}")
    if wrong:
        problems.append(
            "wrong types "
            + ", ".join(f"{n} is {have[n].simpleString()}, contract says {want[n].simpleString()}" for n in wrong)
        )
    if problems:
        raise ContractViolation(table.name, "; ".join(problems))
    return df.select(*[c.name for c in table.columns])


def enforce_not_null(df: DataFrame, table: Table) -> None:
    """Fail fast if a column the contract marks as not nullable holds a null."""
    from pyspark.sql import functions as F

    required = [c.name for c in table.columns if not c.nullable]
    if not required:
        return
    counts = df.select(*[F.sum(F.col(n).isNull().cast("long")).alias(n) for n in required]).first()
    bad = {n: counts[n] for n in required if counts[n]}
    if bad:
        raise ContractViolation(
            table.name, "nulls in non-nullable columns " + ", ".join(f"{n}={v}" for n, v in bad.items())
        )
