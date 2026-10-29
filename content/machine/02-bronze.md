---
id: bronze
order: 2
label: "02 · Bronze"
title: Bronze chamber
color: "#c9a27a"
summary: "Frosted glass. Records land exactly as they arrived, malformed ones included."
project: case-iot-telemetry-lakehouse
draft: false
---

Bronze is the append-only landing zone. Records are written to Delta tables **as they
arrived**, with ingestion metadata attached (`_ingested_at`, `_source_file`,
`_batch_id`). Nothing is fixed here, because the raw copy is what lets you replay
history when a downstream bug is found.

Malformed records (the red flickers) are kept, not dropped. Throwing data away at the
door is how you lose the evidence you need later.

At Trane this was raw HVAC telemetry from 10,000+ devices, landed as Parquet in HDFS
before any transformation touched it.

**Built with:** ADF, ADLS Gen2, HDFS, Parquet / ORC, Delta Lake.
