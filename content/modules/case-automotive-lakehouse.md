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
stack: [Spark, Databricks, Delta Lake]
impact:
  value: "−35%"
  label: "Spark runtime"
links: []
draft: false
---

<!--
  Case study rules: only the result above is confirmed. Every line that starts with
  TODO-SAGAR is a question for Sagar. Those lines show on preview builds and are left
  out of the live site. Replace a TODO-SAGAR line with your answer to publish it.
-->

## Context

Data Engineer at Tiger Analytics, November 2024 to August 2025.

TODO-SAGAR: What kind of client and data was this (industry and data domain), without naming anything confidential?

## The problem

TODO-SAGAR: What was wrong before? For example jobs that ran too long, full reloads, stale data or cost. Say what the 35% was measured on (which jobs, before and after).

## What I did

Cut Spark runtimes by 35%, and built a medallion (Bronze, Silver, Gold) lakehouse on Databricks and Delta Lake.

TODO-SAGAR: Which changes made the 35%? (Your résumé mentions partition pruning, caching, broadcast joins and Adaptive Query Execution. Confirm which applied here.)

TODO-SAGAR: How was the lakehouse laid out, and what did each layer do? (Your résumé also mentions SCD Type 1 and 2, watermark-based incremental loads on ADF and Cloud Composer, and Jenkins deployments. Confirm the ones that belong here.)

## Result

- Spark runtimes cut by **35%**
- A medallion lakehouse on **Databricks** and **Delta Lake**

TODO-SAGAR: Any other outcome you can share, such as cost, freshness or fewer failures? Leave this out if you don't have a number.

## What I'd do differently

TODO-SAGAR: One thing you'd change if you built it again.

## Stack

TODO-SAGAR: The rest of the stack you used on this work. The tools listed at the bottom of this page come from the result above.
