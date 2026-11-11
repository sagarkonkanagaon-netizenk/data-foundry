"""Where the tables live, and the two write patterns every layer uses."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from delta.tables import DeltaTable
from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F

from .contracts import Contracts, Table


def hour_key(ts: datetime) -> str:
    return ts.astimezone(timezone.utc).strftime("%Y-%m-%dT%H")


@dataclass
class Lake:
    root: Path

    def __post_init__(self) -> None:
        self.root = Path(self.root).resolve()

    def path(self, table: Table | str) -> str:
        rel = table.path if isinstance(table, Table) else table
        return str(self.root / rel)

    @property
    def landing(self) -> Path:
        return self.root / "landing"

    @property
    def registry(self) -> Path:
        return self.root / "_registry" / "recentchange_fields.json"

    def exists(self, spark: SparkSession, table: Table | str) -> bool:
        return DeltaTable.isDeltaTable(spark, self.path(table))

    def read(self, spark: SparkSession, table: Table) -> DataFrame:
        if not self.exists(spark, table):
            return spark.createDataFrame([], table.schema)
        return spark.read.format("delta").load(self.path(table))

    def read_hours(self, spark: SparkSession, table: Table, hours: list[str]) -> DataFrame:
        return self.read(spark, table).where(F.col("event_hour").isin(hours))

    def append(self, df: DataFrame, table: Table) -> None:
        w = df.write.format("delta").mode("append")
        if table.partition_by:
            w = w.partitionBy(table.partition_by)
        w.save(self.path(table))

    def replace_hours(self, spark: SparkSession, df: DataFrame, table: Table, hours: list[str]) -> None:
        """Overwrite exactly these hour partitions, atomically. Re-running gives the same table."""
        if not hours:
            return
        if not self.exists(spark, table):
            self.append(df, table)
            return
        in_list = ", ".join(f"'{h}'" for h in sorted(hours))
        (
            df.write.format("delta")
            .mode("overwrite")
            .option("replaceWhere", f"event_hour IN ({in_list})")
            .save(self.path(table))
        )

    def prune(self, spark: SparkSession, contracts: Contracts, keep_hours: int, now: datetime | None = None) -> int:
        """Keep the newest `keep_hours` of data in every table; returns rows deleted.

        The window is measured back from the newest bronze partition, not the clock, so
        replaying an old recorded file never wipes itself out.
        """
        now = now or datetime.now(timezone.utc)
        if not self.exists(spark, contracts.bronze):
            return 0
        newest = self.read(spark, contracts.bronze).agg(F.max("event_hour")).first()[0]
        if newest is None:
            return 0
        newest_dt = datetime.strptime(newest, "%Y-%m-%dT%H").replace(tzinfo=timezone.utc)
        cutoff = hour_key(newest_dt - timedelta(hours=keep_hours))
        deleted = 0
        tables = [contracts.bronze, contracts.silver, contracts.quarantine, *contracts.gold]
        for t in tables:
            if not self.exists(spark, t):
                continue
            dt = DeltaTable.forPath(spark, self.path(t))
            n = dt.toDF().where(F.col("event_hour") < cutoff).count()
            if n:
                dt.delete(F.col("event_hour") < cutoff)
                dt.vacuum(0)
                deleted += n
        for f in self.landing.glob("*.jsonl"):
            if datetime.fromtimestamp(f.stat().st_mtime, timezone.utc) < now - timedelta(hours=keep_hours):
                f.unlink()
        return deleted
