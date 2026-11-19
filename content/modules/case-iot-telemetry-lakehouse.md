---
slug: case-iot-telemetry-lakehouse
order: 1
kind: case-study
scene: telemetry
codename: CASE 01
title: "Schema evolution for 10,000+ IoT telemetry streams"
status: Case study · RedBlackTree
problem: "Zero-downtime schema evolution for 10,000+ IoT telemetry streams on an Azure lakehouse."
diagram: ["10,000+ telemetry streams", Bronze, Silver, Gold]
stack: [PySpark, Azure Databricks, Delta Lake, Azure Data Factory, ADLS Gen2, Hadoop, HDFS, Hive, Parquet]
impact:
  value: "10,000+"
  label: "IoT telemetry streams"
links: []
draft: false
---

<!--
  Case study rules: every fact on this page comes from Sagar's résumé (November 2026).
  Lines that start with TODO-SAGAR are open questions: they show on preview builds and
  are left out of the live site.
-->

## Context

Senior Data Engineer at RedBlackTree, August 2025 to January 2026, on an Azure lakehouse
and industrial IoT telemetry data platform.

## The problem

Connected devices change what they send. A pipeline with a fixed schema has to be
redeployed for every change upstream, or it breaks the tables downstream.

## What I did

- **Pipelines.** Azure Databricks, PySpark and Hadoop/HDFS pipelines for connected IoT
  devices, using window functions, aggregations and broadcast joins to load Parquet on
  ADLS Gen2 and partitioned Hive tables.
- **Medallion layers.** Telemetry organised into Bronze, Silver and Gold Delta Lake layers,
  with Azure Data Factory orchestrating ingestion and the Databricks jobs downstream.
- **Schema evolution.** Dynamic schema evolution on Databricks and Delta Lake, with schema
  inference, so upstream changes flowed through without a pipeline redeploy or
  downstream breakage.
- **Traceability.** Automated data validation, lineage tracking and reusable ETL
  components, for audit traceability and less duplicated engineering work.

## Result

- Zero-downtime schema evolution across **10,000+** IoT telemetry streams
- Upstream changes absorbed **without redeploying** the pipeline

## What I'd do differently

TODO-SAGAR: One thing you'd change if you built it again.

## In the machine

The machine's **Schema drift** drill, and the real schema registry in `/pipeline`, use the
same idea on a public stream.
