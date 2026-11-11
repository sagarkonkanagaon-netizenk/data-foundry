"""Gold: small aggregate tables, rebuilt whole for every hour partition a run touched."""

from __future__ import annotations

from pyspark.sql import DataFrame, SparkSession, Window
from pyspark.sql import functions as F

from .contracts import Contracts, Table, enforce_not_null, enforce_schema
from .lake import Lake

EDIT_TYPES = ["edit", "new"]


def _table(contracts: Contracts, name: str) -> Table:
    return next(t for t in contracts.gold if t.name == name)


def edits(silver: DataFrame) -> DataFrame:
    return silver.where(F.col("change_type").isin(EDIT_TYPES))


def edits_per_wiki_hour(silver: DataFrame) -> DataFrame:
    delta = F.col("length_new") - F.coalesce(F.col("length_old"), F.lit(0))
    return (
        edits(silver)
        .groupBy("event_hour", "wiki")
        .agg(
            F.count("*").alias("edits"),
            F.sum((F.col("change_type") == "new").cast("long")).alias("new_pages"),
            F.sum(F.col("is_bot").cast("long")).alias("bot_edits"),
            F.coalesce(F.sum(F.greatest(delta, F.lit(0))), F.lit(0)).cast("long").alias("bytes_added"),
            F.coalesce(F.sum(F.greatest(-delta, F.lit(0))), F.lit(0)).cast("long").alias("bytes_removed"),
        )
    )


def bot_share_hour(silver: DataFrame) -> DataFrame:
    return (
        edits(silver)
        .groupBy("event_hour")
        .agg(F.count("*").alias("edits"), F.sum(F.col("is_bot").cast("long")).alias("bot_edits"))
        .withColumn("human_edits", F.col("edits") - F.col("bot_edits"))
        .withColumn("bot_share", F.round(F.col("bot_edits") / F.col("edits"), 4))
    )


def top_pages_hour(silver: DataFrame, n: int = 10) -> DataFrame:
    w = Window.partitionBy("event_hour").orderBy(F.desc("edits"), "wiki", "title")
    return (
        edits(silver)
        .groupBy("event_hour", "wiki", "title")
        .agg(F.count("*").alias("edits"))
        .withColumn("rank", F.row_number().over(w))
        .where(F.col("rank") <= n)
    )


def build(contracts: Contracts, silver: DataFrame) -> dict[str, DataFrame]:
    top_n = _table(contracts, "gold.top_pages_hour").extra.get("top_n") or 10
    return {
        "gold.edits_per_wiki_hour": edits_per_wiki_hour(silver),
        "gold.bot_share_hour": bot_share_hour(silver),
        "gold.top_pages_hour": top_pages_hour(silver, top_n),
    }


def write(
    spark: SparkSession, lake: Lake, contracts: Contracts, tables: dict[str, DataFrame], hours: list[str]
) -> dict[str, int]:
    """Enforce each table's contract first (all of them), then replace the hours. Returns rows per table."""
    checked = {}
    for name, df in tables.items():
        t = _table(contracts, name)
        df = enforce_schema(df, t)
        enforce_not_null(df, t)
        checked[name] = df.cache()
    rows = {}
    for name, df in checked.items():
        lake.replace_hours(spark, df, _table(contracts, name), hours)
        rows[name] = df.count()
    return rows
