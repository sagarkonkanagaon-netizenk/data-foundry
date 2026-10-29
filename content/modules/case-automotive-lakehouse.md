---
slug: case-automotive-lakehouse
order: 2
kind: case-study
scene: lakehouse
codename: CASE 02
title: "Automotive medallion lakehouse"
status: Case study · Tiger Analytics
problem: "Large automotive manufacturing and supply-chain datasets were reprocessed with full loads, so Spark jobs ran long, burned cluster time and delivered stale data."
diagram: [ADF + Composer ingestion, Bronze (Delta), Silver · SCD 1/2, Gold marts, Analytics]
stack: [PySpark, Azure Databricks, Delta Lake, ADF, Cloud Composer, Airflow, Hive, Jenkins]
impact:
  value: "−35%"
  label: "Spark pipeline runtime"
links: []
draft: false
---

**Context.** An automotive client's data platform for manufacturing and supply-chain
data (Nov 2024 – Aug 2025).

**What I built.** A Medallion Architecture (Bronze → Silver → Gold) on Azure Databricks
with Delta Lake: progressive refinement from raw ingestion to analytics-ready tables,
with SCD Type 1 and 2 on dimension tables using surrogate keys.

**Performance.** Cut distributed pipeline runtime by **35%** with partition pruning,
caching, broadcast joins and Adaptive Query Execution, which also reduced cluster
resource consumption.

**Incremental loads.** Watermark-based change detection with ADF triggers and Airflow
DAGs on GCP Cloud Composer replaced redundant full loads and reduced data latency.

**Delivery.** Git branching and Jenkins pipelines to test and deploy Spark jobs across
Dev, QA and Production, removing manual configuration drift.
