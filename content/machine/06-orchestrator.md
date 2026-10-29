---
id: orchestrator
order: 6
label: "06 · Orchestrator"
title: Orchestrator
color: "#7fd8ff"
summary: "A holographic DAG above the machine. Each node lights as its task runs."
project: case-ebay-orchestration-migration
# Tasks shown in the floating DAG, in run order.
tasks: [extract, land_bronze, spark_transform, dq_checks, merge_silver, build_gold, publish]
draft: false
---

Nothing in the machine runs on its own. The orchestrator decides **what runs, in what
order, and what happens when something fails**: retries with backoff, sensors that
wait for late files, SLAs that page a human only when it matters.

At eBay I migrated **300+ production pipelines** from UC4 (Automic) to Data Lake
Studio, and I carry the PagerDuty pager when they misbehave. Before that: Airflow DAGs
on Cloud Composer and ADF triggers at Tiger Analytics, shipped through Jenkins.

**Built with:** UC4 / Automic, DLS, Airflow, Cloud Composer, ADF, Jenkins, PagerDuty.
