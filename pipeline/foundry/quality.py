"""Data quality checks, run after every write. Results are saved with the run.

Each check returns pass, warn, fail or skip, what it observed and the threshold. A
failed `error` check marks the run failed; a failed `warn` check marks it warned.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F

from .contracts import Contracts
from .gold import EDIT_TYPES
from .lake import Lake
from .silver import SilverResult


@dataclass
class Check:
    check: str
    target: str
    status: str  # pass | warn | fail | skip
    observed: Any
    threshold: Any
    severity: str  # error | warn
    detail: str = ""

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def _status(ok: bool, severity: str) -> str:
    return "pass" if ok else ("fail" if severity == "error" else "warn")


def run_checks(
    spark: SparkSession,
    lake: Lake,
    contracts: Contracts,
    result: SilverResult,
    landed: int | None,
    live: bool,
    now: datetime,
) -> list[Check]:
    hours = result.hours
    silver = lake.read_hours(spark, contracts.silver, hours).cache()
    quality = contracts.silver_rules.get("quality", {})
    checks: list[Check] = []

    # 1. row count: a live run must land something
    min_rows = contracts.bronze.extra.get("min_rows", 1)
    if landed is None:
        checks.append(
            Check(
                "row_count",
                contracts.bronze.name,
                "skip",
                None,
                f">= {min_rows}",
                "error",
                "re-run of existing partitions",
            )
        )
    else:
        checks.append(
            Check(
                "row_count",
                contracts.bronze.name,
                _status(landed >= min_rows, "error"),
                landed,
                f">= {min_rows}",
                "error",
            )
        )

    # 2. null rates per column, over the hours this run touched
    total = silver.count()
    for col, limit in quality.get("max_null_rate", {}).items():
        nulls = silver.where(F.col(col).isNull()).count()
        rate = nulls / total if total else 0.0
        checks.append(
            Check(
                "null_rate",
                f"{contracts.silver.name}.{col}",
                _status(rate <= limit, "error"),
                round(rate, 4),
                f"<= {limit}",
                "error",
            )
        )

    # 3. uniqueness of the key
    key = contracts.silver_rules.get("key", "event_id")
    distinct = silver.select(key).distinct().count()
    checks.append(
        Check(
            "unique",
            f"{contracts.silver.name}.{key}",
            _status(distinct == total, "error"),
            total - distinct,
            "0 duplicates",
            "error",
        )
    )

    # 4. freshness: how old the newest event is (live runs only; a replay is old by design)
    limit_min = quality.get("freshness_minutes", 30)
    if not live:
        checks.append(
            Check("freshness", contracts.silver.name, "skip", None, f"<= {limit_min} min", "warn", "replay or re-run")
        )
    else:
        newest = silver.agg(F.max("event_ts")).first()[0]
        age = (now.replace(tzinfo=None) - newest).total_seconds() / 60 if newest else None
        ok = age is not None and age <= limit_min
        checks.append(
            Check(
                "freshness",
                contracts.silver.name,
                _status(ok, "warn"),
                None if age is None else round(age, 1),
                f"<= {limit_min} min",
                "warn",
                "minutes since the newest event",
            )
        )

    # 5. reconciliation: every bronze row is accounted for exactly once
    # (duplicates are counted again here from the tables as written, not taken from the build)
    bronze = lake.read_hours(spark, contracts.bronze, hours)
    quarantine = lake.read_hours(spark, contracts.quarantine, hours)
    bronze_n, quarantine_n = bronze.count(), quarantine.count()
    bad_text = quarantine.select(F.sha2("raw", 256).alias("_h")).distinct()
    hashed = bronze.withColumn("_h", F.sha2("raw", 256))
    bad_copies = hashed.join(bad_text, "_h", "left_semi").count()
    valid = hashed.join(bad_text, "_h", "left_anti")
    duplicates = (bad_copies - bad_text.count()) + (valid.count() - valid.select("event_id").distinct().count())
    accounted = total + quarantine_n + duplicates
    checks.append(
        Check(
            "reconciliation",
            "bronze -> silver",
            _status(bronze_n == accounted, "error"),
            {"bronze": bronze_n, "silver": total, "quarantine": quarantine_n, "duplicates": duplicates},
            "bronze = silver + quarantine + duplicates",
            "error",
        )
    )

    # 6. reconciliation: gold edit totals match silver
    silver_edits = silver.where(F.col("change_type").isin(EDIT_TYPES)).count()
    gold = next(t for t in contracts.gold if t.name == "gold.edits_per_wiki_hour")
    gold_df: DataFrame = lake.read_hours(spark, gold, hours)
    gold_edits = gold_df.agg(F.coalesce(F.sum("edits"), F.lit(0))).first()[0]
    checks.append(
        Check(
            "reconciliation",
            "silver -> gold",
            _status(gold_edits == silver_edits, "error"),
            {"silver_edits": silver_edits, "gold_edits": gold_edits},
            "equal",
            "error",
        )
    )

    # 7. reject rate (the hard limit is in the contract; this is the early warning)
    warn_at = quality.get("warn_reject_rate", 0.05)
    checks.append(
        Check(
            "reject_rate",
            contracts.quarantine.name,
            _status(result.reject_rate <= warn_at, "warn"),
            round(result.reject_rate, 4),
            f"<= {warn_at}",
            "warn",
        )
    )

    silver.unpersist()
    return checks


def save(spark: SparkSession, lake: Lake, checks: list[Check], run_id: str, at: datetime) -> None:
    """Append the results to ops/dq_results, so DQ history is queryable alongside the data."""
    import json

    rows = [
        (run_id, at, c.check, c.target, c.status, c.severity, json.dumps(c.observed), str(c.threshold), c.detail)
        for c in checks
    ]
    schema = "run_id string, checked_at timestamp, check string, target string, status string, severity string, observed string, threshold string, detail string"
    spark.createDataFrame(rows, schema).write.format("delta").mode("append").save(lake.path("ops/dq_results"))
