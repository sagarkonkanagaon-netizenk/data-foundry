---
slug: case-ebay-orchestration-migration
order: 3
kind: case-study
scene: migration
codename: CASE 03
title: "Moving 300+ pipelines to a new orchestrator"
status: Case study · eBay
problem: "Migrating 300+ production pipelines from UC4 (Automic) to the in-house DLS platform, plus a two-year backfill."
diagram: [UC4 (Automic), Migration, DLS platform, 2-year backfill]
stack: [UC4 / Automic, DLS, Hadoop, Hive, PySpark, Spark SQL, Data contracts, PagerDuty]
impact:
  value: "300+"
  label: "pipelines migrated from UC4 to DLS"
links: []
draft: false
---

<!--
  Case study rules: every fact on this page comes from Sagar's résumé (Senior Data
  Engineer, November 2026). Lines that start with TODO-SAGAR are still open questions:
  they show on preview builds and are left out of the live site.
-->

## Context

Senior Data Engineer at eBay, January 2026 to now, on a full-time contract. I develop
PySpark and Spark SQL pipelines on a petabyte-scale Hadoop platform, with tables of
around 2 trillion records, that feed downstream analytical systems within
data-freshness SLAs.

## The problem

More than 300 production pipelines ran on UC4 (Automic), the legacy scheduler, and had
to move to eBay's in-house DLS (Data Lake Studio) orchestration platform. Some of them
were SLA- and SLE-critical, so they had to keep delivering on time through the move,
and some data had to be reprocessed for years back.

## What I did

- **Mapped the dependencies first.** I analysed the UC4 job-plan dependencies, split
  large workflows into independent units, and rebuilt them as DLS pipelines.
- **Agreed the contract before the code.** Before onboarding a pipeline I validated its
  data contract with the PD team: schema, field-level definitions and source-to-target
  mappings, agreed ahead of development.
- **Made cutover reversible.** I owned build and release for the migration: deployment
  artifacts, packaged and versioned JARs, and the previous stable JAR kept as the
  rollback path.
- **Backfilled, then proved it.** I delivered several historical backfills, including a
  two-year reprocess across high-volume pipelines, and validated every reprocessed
  dataset for completeness and consistency before releasing it downstream.
- **Stayed on call for it.** I own production reliability for these pipelines: I
  root-cause Spark and Hive failures and ship the fixes, on call through PagerDuty.
- **Wrote it down.** I built an AI-assisted documentation repository of the
  end-to-end pipeline flows, used to share knowledge and onboard new engineers faster.

## Result

- **300+** production pipelines migrated from UC4 (Automic) to DLS, including SLA- and
  SLE-critical jobs
- A **two-year** reprocess, plus other historical backfills, each validated before release
- Pipelines on a petabyte-scale platform with tables of **~2 trillion** records

TODO-SAGAR: Anything measurable after the move that you can share, such as incidents, run times or effort saved? Leave this out if you don't have a number.

## What I'd do differently

TODO-SAGAR: One thing you'd change if you did this migration again.

## In the machine

The pipeline on this site is built the same way: each source has a YAML data contract,
and `foundry backfill` rebuilds any range of hours and can run twice without
duplicating a row.
