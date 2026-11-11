"""Silver: typed, validated, deduplicated. Bad rows go to quarantine with a reason.

Everything about the columns comes from contracts/silver.yaml: where each value is in
the raw event, its type, whether it may be null, and which values are allowed. The
code below only applies those rules.

Silver is rebuilt per hour partition from all bronze rows in that hour, so the same
code serves a normal run, a re-run of one hour, and a backfill, and running any of them
twice gives the same table.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from pyspark.sql import Column as SparkColumn
from pyspark.sql import DataFrame, SparkSession, Window
from pyspark.sql import functions as F

from .contracts import Contracts, ContractViolation, enforce_not_null, enforce_schema, spark_type
from .lake import Lake


@dataclass
class SilverResult:
    bronze_rows: int
    silver_rows: int
    quarantined: int
    duplicates: int
    rejects_by_reason: dict[str, int]
    reject_samples: list[dict]
    hours: list[str]

    @property
    def reject_rate(self) -> float:
        return self.quarantined / self.bronze_rows if self.bronze_rows else 0.0


def known_top_level(contracts: Contracts) -> list[str]:
    tops = {k.split(".")[0] for k in contracts.known_fields}
    tops |= {c.source[2:].split(".")[0] for c in contracts.source_columns if c.source}
    return sorted(tops)


def typed(bronze: DataFrame, contracts: Contracts, processed_at: datetime) -> DataFrame:
    """Every bronze row with its typed silver columns plus `reason` (null when the row is good)."""
    df = bronze.withColumn("_obj", F.from_json("raw", "map<string,string>"))
    reasons: list[SparkColumn] = [
        F.when(F.col("_obj").isNull(), F.lit("malformed_json")),
    ]
    drop = contracts.silver_rules.get("drop_domains") or []
    if drop:
        reasons.append(F.when(F.get_json_object("raw", "$.meta.domain").isin(drop), F.lit("filtered:domain")))
    for c in contracts.source_columns:
        text = F.get_json_object("raw", c.source)
        value = text.try_cast(spark_type(c.type)) if c.type != "timestamp" else F.try_to_timestamp(text)
        df = df.withColumn(c.name, value)
        if not c.nullable:
            reasons.append(F.when(text.isNull(), F.lit(f"null:{c.name}")))
        reasons.append(F.when(text.isNotNull() & F.col(c.name).isNull(), F.lit(f"type:{c.name}")))
        if c.accepted_values:
            reasons.append(
                F.when(F.col(c.name).isNotNull() & ~F.col(c.name).isin(c.accepted_values), F.lit(f"domain:{c.name}"))
            )
    known = F.array(*[F.lit(k) for k in known_top_level(contracts)])
    return (
        df.withColumn("reason", F.coalesce(*reasons))
        .withColumn(
            "extras",
            F.coalesce(
                F.map_filter("_obj", lambda k, _v: ~F.array_contains(known, k)),
                F.create_map().cast("map<string,string>"),
            ),
        )
        .withColumn("_processed_at", F.lit(processed_at).cast("timestamp"))
        .drop("_obj")
    )


def build(
    spark: SparkSession, lake: Lake, contracts: Contracts, hours: list[str], processed_at: datetime
) -> tuple[SilverResult, DataFrame, DataFrame]:
    """Compute silver and quarantine for these hours. Nothing is written yet."""
    bronze = lake.read_hours(spark, contracts.bronze, hours)
    # every downstream count reads this, so compute the typed rows once
    rows = typed(bronze, contracts, processed_at).localCheckpoint()
    # bronze's own columns event_id/event_ts are replaced by the contract's typed ones
    good = rows.where(F.col("reason").isNull())
    key = contracts.silver_rules.get("key", "event_id")
    w = Window.partitionBy(key).orderBy(F.col("_ingested_at"), F.col("_run_id"), F.col("_line"))
    ranked = good.withColumn("_rank", F.row_number().over(w))
    silver = ranked.where("_rank = 1").drop("_rank")
    silver = silver.select(*[c.name for c in contracts.silver.columns])
    # a bad line delivered twice is quarantined once (same text, earliest copy kept)
    wb = Window.partitionBy(F.sha2("raw", 256)).orderBy(F.col("_ingested_at"), F.col("_run_id"), F.col("_line"))
    bad = (
        rows.where(F.col("reason").isNotNull())
        .withColumn("_rank", F.row_number().over(wb))
        .where("_rank = 1")
        .select(*[c.name for c in contracts.quarantine.columns])
    )

    silver, bad = silver.localCheckpoint(), bad.localCheckpoint()
    n_bronze, n_silver, n_bad = rows.count(), silver.count(), bad.count()
    by_reason = {r["reason"]: r["count"] for r in bad.groupBy("reason").count().collect()}
    samples = [
        {
            "reason": r["reason"],
            "event_id": r["event_id"],
            "event_hour": r["event_hour"],
            "line": r["_line"],
            "raw": (r["raw"] or "")[:300],
        }
        for r in bad.orderBy("event_hour", "_line").limit(5).collect()
    ]
    result = SilverResult(
        n_bronze, n_silver, n_bad, n_bronze - n_silver - n_bad, dict(sorted(by_reason.items())), samples, hours
    )
    return result, silver, bad


def write(
    spark: SparkSession, lake: Lake, contracts: Contracts, result: SilverResult, silver: DataFrame, bad: DataFrame
) -> list[str]:
    """Enforce the contract, then replace the hour partitions. Returns contract-level notes."""
    limit = contracts.silver_rules.get("max_reject_rate")
    if limit is not None and result.reject_rate > limit:
        raise ContractViolation(
            contracts.silver.name,
            f"{result.reject_rate:.1%} of rows rejected, above the contract's limit of {limit:.0%}; "
            f"top reasons {dict(list(sorted(result.rejects_by_reason.items(), key=lambda kv: -kv[1]))[:3])}",
        )
    silver = enforce_schema(silver, contracts.silver)
    enforce_not_null(silver, contracts.silver)
    bad = enforce_schema(bad, contracts.quarantine)
    notes = evolve_table(spark, lake, contracts)
    lake.replace_hours(spark, silver, contracts.silver, result.hours)
    lake.replace_hours(spark, bad, contracts.quarantine, result.hours)
    return notes


def evolve_table(spark: SparkSession, lake: Lake, contracts: Contracts) -> list[str]:
    """If the contract gained a column, add it to the existing Delta table (additive only)."""
    table = contracts.silver
    if not lake.exists(spark, table):
        return []
    existing = {f.name: f.dataType for f in lake.read(spark, table).schema.fields}
    notes = []
    for c in table.columns:
        t = spark_type(c.type)
        if c.name not in existing:
            spark.sql(f"ALTER TABLE delta.`{lake.path(table)}` ADD COLUMNS (`{c.name}` {t.simpleString()})")
            notes.append(f"added column {c.name} {t.simpleString()} to {table.name}")
        elif existing[c.name] != t:
            raise ContractViolation(
                table.name,
                f"column {c.name} is {existing[c.name].simpleString()} in the table, contract says {t.simpleString()}",
            )
    return notes


SAMPLE_COLUMNS = [
    "event_id",
    "event_ts",
    "wiki",
    "change_type",
    "namespace",
    "title",
    "is_bot",
    "length_old",
    "length_new",
]


def sample_rows(silver: DataFrame, n: int = 12) -> list[dict]:
    """A few silver rows for the report, picked by a hash of the key so a re-run picks the same ones."""
    rows = silver.select(*SAMPLE_COLUMNS).orderBy(F.xxhash64("event_id"), "event_id").limit(n).collect()
    return [
        {k: (v.isoformat() + "Z" if k == "event_ts" and v is not None else v) for k, v in r.asDict().items()}
        for r in rows
    ]
