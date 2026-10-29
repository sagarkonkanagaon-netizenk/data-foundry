---
slug: case-ebay-orchestration-migration
order: 7
kind: case-study
codename: CASE 03
title: "Migrating 300+ pipelines without dropping one"
status: Case study · eBay
problem: "Hundreds of production pipelines ran on legacy UC4 (Automic) orchestration and had to move to Data Lake Studio while downstream analytics kept running."
diagram: [UC4 job plans, Dependency split, DLS pipelines, Stable JAR cutover, 2-yr backfill]
stack: [PySpark, Spark SQL, Hadoop, Hive, UC4 / Automic, DLS, PagerDuty, Git]
impact:
  value: "300+"
  label: "production pipelines migrated"
links: []
draft: false
---

**Context.** As a Senior Data Engineer at eBay (Jan 2026 – present) I build and run
PySpark and Spark SQL pipelines on eBay's Hadoop infrastructure, delivering
high-volume data to analytical systems against freshness SLAs.

**What I did.** Migrated 300+ production pipelines from UC4 (Automic) to DLS (Data Lake
Studio). Workflows were first split along their job-plan dependencies, then rebuilt
from scratch on the new orchestration layer.

**Cutover safety.** For the ADLC migration I built deployment artifacts and
packaged and versioned JARs, rolling newer builds back to prior stable versions where
needed so pipelines stayed stable through cutover.

**Backfill.** Ran an end-to-end two-year historical backfill across high-volume
pipelines, verifying completeness and consistency for downstream analytics.

**Also.** Validated data contracts (schema, field definitions, source-to-target
mappings) before onboarding, built AI repositories that document end-to-end pipeline
flows for faster onboarding, and triage Spark and Hive incidents on PagerDuty.
