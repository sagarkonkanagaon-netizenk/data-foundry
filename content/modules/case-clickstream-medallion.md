---
slug: case-clickstream-medallion
order: 6
kind: case-study
codename: CASE 02
title: "High-volume e-commerce event pipelines"
status: Case study · eBay
problem: "Large daily event volumes made batch jobs slow and expensive, and skewed keys caused unpredictable runtimes."
diagram: [Event sources, Spark batch on Hadoop / Hive, Optimised joins + partitioning, Analytics tables]
stack: [PySpark, Spark SQL, Hadoop, Hive, Airflow]
impact:
  value: "TBD"
  label: "runtime reduction"
links:
  - label: Write-up
    href: "#"
draft: true
---

**Context.** Describe the system, the scale and the consumers.

**What I built.** Spark jobs for event processing with deliberate partitioning,
skew handling and incremental loads.

**Hard part.** Write the one problem that took real thinking.

**Result.** Put the measured outcome here.

**Status:** placeholder framing. Replace with the real story; keep anything
confidential vague.
