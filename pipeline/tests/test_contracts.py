import pytest
from pyspark.sql import types as T

from foundry.contracts import ContractViolation, enforce_not_null, enforce_schema


def test_every_layer_has_a_contract(contract):
    assert contract.bronze.name == "bronze.recentchange"
    assert contract.silver.column("event_id").nullable is False
    assert {t.name for t in contract.gold} == {"gold.edits_per_wiki_hour", "gold.bot_share_hour", "gold.top_pages_hour"}
    # every silver column read from the event names a JSON path
    assert all(c.source.startswith("$.") for c in contract.source_columns)


def test_schema_mismatch_fails_fast(spark, contract):
    df = spark.createDataFrame([("x",)], "raw string")
    with pytest.raises(ContractViolation, match="missing columns"):
        enforce_schema(df, contract.bronze)


def test_wrong_type_fails_fast(spark, contract):
    gold = next(t for t in contract.gold if t.name == "gold.bot_share_hour")
    df = spark.createDataFrame(
        [("2026-11-11T16", 1, 1, 0, 1.0)],
        "event_hour string, edits int, bot_edits long, human_edits long, bot_share double",
    )
    with pytest.raises(ContractViolation, match="edits is int, contract says bigint"):
        enforce_schema(df, gold)


def test_null_in_required_column_fails_fast(spark, contract):
    gold = next(t for t in contract.gold if t.name == "gold.bot_share_hour")
    schema = T.StructType(
        [
            T.StructField(
                c.name, T.StringType() if c.type == "string" else T.LongType() if c.type == "long" else T.DoubleType()
            )
            for c in gold.columns
        ]
    )
    df = spark.createDataFrame([(None, 1, 1, 0, 1.0)], schema)
    with pytest.raises(ContractViolation, match="event_hour=1"):
        enforce_not_null(df, gold)
