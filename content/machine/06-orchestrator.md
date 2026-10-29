---
id: orchestrator
order: 6
label: "06 · Orchestrator"
title: Orchestrator
color: "#7fd8ff"
summary: "A holographic DAG above the machine. Each node lights as its task runs."
project: rewind
# Tasks shown in the floating DAG, in run order.
tasks: [extract, land_bronze, spark_transform, dq_checks, merge_silver, build_gold, publish]
draft: true
---

Nothing in the machine runs on its own. The orchestrator decides **what runs, in what
order, and what happens when something fails**: retries with backoff, sensors that
wait for late files, SLAs that page a human only when it matters.

I have run this layer on Airflow / Cloud Composer and Azure Data Factory, with
pipelines deployed through Jenkins and Azure DevOps.

**Built with:** Airflow, Cloud Composer, ADF, Jenkins, Azure DevOps.
