"""Bronze: land every line exactly as received, with ingestion metadata. Append-only."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F
from pyspark.sql import types as T

from .contracts import Contracts, ContractViolation, enforce_not_null, enforce_schema
from .lake import Lake


def read_landing(spark: SparkSession, landing: Path, run_id: str, source: str, ingested_at: datetime) -> DataFrame:
    lines = [ln for ln in landing.read_text(encoding="utf-8").splitlines() if ln.strip()]
    schema = T.StructType([T.StructField("_line", T.LongType()), T.StructField("raw", T.StringType())])
    df = spark.createDataFrame([(i + 1, ln) for i, ln in enumerate(lines)], schema)
    event_ts = F.try_to_timestamp(F.get_json_object("raw", "$.meta.dt"))
    ingest_hour = F.date_format(F.lit(ingested_at).cast("timestamp"), "yyyy-MM-dd'T'HH")
    return df.select(
        "raw",
        F.get_json_object("raw", "$.meta.id").alias("event_id"),
        event_ts.alias("event_ts"),
        F.coalesce(F.date_format(event_ts, "yyyy-MM-dd'T'HH"), ingest_hour).alias("event_hour"),
        F.lit(run_id).alias("_run_id"),
        F.lit(source).alias("_source"),
        "_line",
        F.lit(ingested_at).cast("timestamp").alias("_ingested_at"),
    )


def land(spark: SparkSession, lake: Lake, contracts: Contracts, df: DataFrame, run_id: str) -> dict:
    """Append the run's rows. Landing the same run twice is a no-op, so retries are safe."""
    table = contracts.bronze
    df = enforce_schema(df, table)
    enforce_not_null(df, table)
    if lake.exists(spark, table) and not lake.read(spark, table).where(F.col("_run_id") == run_id).isEmpty():
        rows = df.count()
        return {"rows_in": rows, "rows_out": 0, "already_landed": True, "hours": hours_of(df)}
    rows = df.count()
    if rows == 0:
        raise ContractViolation(table.name, "no rows to land")
    lake.append(df, table)
    return {"rows_in": rows, "rows_out": rows, "already_landed": False, "hours": hours_of(df)}


def hours_of(df: DataFrame) -> list[str]:
    return sorted(r[0] for r in df.select("event_hour").distinct().collect())
