---
slug: case-automotive-lakehouse
order: 2
kind: case-study
scene: lakehouse
codename: CASE 02
title: "A faster medallion lakehouse"
status: Case study · Tiger Analytics
problem: "Cutting Spark runtimes by 35%, and building a medallion lakehouse on Databricks and Delta Lake."
diagram: [Bronze (Delta), Silver (Delta), Gold (Delta), Databricks]
stack: [PySpark, Azure Databricks, Delta Lake, Azure Data Factory, Airflow / Cloud Composer, Hive, Jenkins]
impact:
  value: "−35%"
  label: "Spark runtime"
links: []
draft: false
---

<!--
  Case study rules: every fact on this page comes from Sagar's résumé (Senior Data
  Engineer, November 2026). Lines that start with TODO-SAGAR are still open questions:
  they show on preview builds and are left out of the live site.
-->

## Context

Data Engineer at Tiger Analytics, November 2024 to August 2025, on an automotive data
platform: ETL and ELT pipelines for large-scale automotive manufacturing and
supply-chain datasets.

## The problem

Spark jobs used more time and cluster than they needed, and data was refreshed with
full reloads, which kept it later than it had to be.

## What I did

- **Tuned the Spark jobs.** Partition pruning, caching, broadcast joins and Adaptive
  Query Execution (AQE) cut job runtimes by 35% and reduced cluster resource use.
- **Built a medallion lakehouse.** Bronze, Silver and Gold layers on Azure Databricks
  with Delta Lake, from raw ingestion to analytics-ready datasets, with SCD Type 1 and
  Type 2 dimension tables using surrogate keys.
- **Replaced full reloads.** Incremental ingestion with watermark-based change
  detection, triggered from Azure Data Factory and Airflow DAGs on GCP Cloud Composer,
  reduced data latency.
- **Automated releases.** Spark jobs were tested and deployed across Dev, QA and
  Production with Git branching and Jenkins pipelines.

## Result

- Spark job runtimes cut by **35%**
- A medallion lakehouse on **Azure Databricks** and **Delta Lake**
- Full reloads replaced by **incremental**, watermark-based ingestion

## What I'd do differently

TODO-SAGAR: One thing you'd change if you built it again.

## In the machine

The pipeline on this site has the same Bronze, Silver and Gold layers in Delta, with
idempotent `MERGE` loads.
