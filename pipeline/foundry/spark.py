"""The SparkSession: local mode with Delta Lake."""

from __future__ import annotations

from delta import configure_spark_with_delta_pip
from pyspark.sql import SparkSession


def get_spark(app_name: str = "data-foundry") -> SparkSession:
    builder = (
        SparkSession.builder.appName(app_name)
        .master("local[2]")
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
        .config("spark.sql.session.timeZone", "UTC")
        # small data: a handful of shuffle partitions keeps local runs fast
        .config("spark.sql.shuffle.partitions", "4")
        .config("spark.ui.enabled", "false")
        # retention is enforced by the pipeline itself (see lake.prune)
        .config("spark.databricks.delta.retentionDurationCheck.enabled", "false")
        .config("spark.driver.memory", "2g")
        .config("spark.ui.showConsoleProgress", "false")
        # Delta reads its log with this many tasks; the default 50 is sized for big tables
        .config("spark.databricks.delta.snapshotPartitions", "2")
    )
    spark = configure_spark_with_delta_pip(builder).getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")
    return spark
