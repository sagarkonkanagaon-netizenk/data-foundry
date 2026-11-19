---
slug: case-ebay-orchestration-migration
order: 3
kind: case-study
scene: migration
codename: CASE 03
title: "350+ workflows migrated, billions of rows reconciled"
status: Case study · eBay
problem: "Migrating 350+ SLA-critical workflows from UC4 to DLS, replicating Oracle with ZeroETL, and backfilling billions of encrypted rows, on tables of ~2 trillion records."
diagram: [UC4 (Automic), DLS workflows, ZeroETL replication, Reconciled backfills]
stack: [Hadoop, HDFS, DistCP, Hive, Spark, PySpark, Scala UDF, Spark SQL, Zeta, DLS, UC4 / Automic, Oracle, ZeroETL, BDP, iDO, ADLC CI/CD, PagerDuty]
impact:
  value: "350+"
  label: "workflows migrated from UC4 to DLS"
links: []
draft: false
---

<!--
  Case study rules: every fact on this page comes from Sagar's résumé (November 2026).
  Lines that start with TODO-SAGAR are open questions: they show on preview builds and
  are left out of the live site.
-->

## Context

Senior Data Engineer at eBay, January 2026 to now. I build and run PySpark and Spark SQL
pipelines on a petabyte-scale Hadoop platform, with tables of around 2 trillion records.

## The problem

More than 350 production workflows, many of them SLA- and SLE-critical, ran on UC4
(Automic) and had to move to DLS (Data Lake Studio), eBay's in-house orchestration
platform, without missing their deadlines. At the same time, data had to be replicated
from Oracle and backfilled into a new internal database, with sensitive columns
encrypted and every row accounted for.

## What I did

- **Migrated 350+ workflows.** Across several batch-account domains, I split complex
  UC4 dependency graphs into modular DLS workflows that can each be scheduled on their own.
- **Built three ZeroETL Oracle replication pipelines from scratch.** I rewrote the
  staging queries from CASE-based to STACK-based logic, fixed attribute-mapping bugs,
  and reconciled the ~975B-row and ~300B-row datasets end to end.
- **Ran AES-encrypted backfills into a new internal database.** I led the schema-evolution
  rollouts: a zero-gap 13.2M-row backfill after DistCP and path swaps, and a 12.4B-row
  backfill with full completeness validation.
- **Moved deployments onto CI/CD.** Scala Spark UDF JARs used to be placed on HDFS by hand.
  I moved them to ADLC, eBay's internal CI/CD for Hadoop applications: commit-triggered
  builds, CVE scanning, a push to the container image registry, and artifacts unpacked
  and copied to Hadoop.
- **Governed sensitive data.** Through BDP (Big Data Portal) I govern PII columns, lineage
  and the Product Development data contracts, so sensitive attributes stay classified,
  encrypted and traceable for downstream consumers.
- **Own reliability.** I monitor batch accounts in iDO (Intelligent Data Operation),
  investigate in Zeta notebooks, and am on call through PagerDuty, resolving P0 and P1
  SLA/SLE issues with PySpark and Spark SQL fixes.
- **Engineered with AI assistants.** I use AI coding assistants every day, with custom
  skills and slash commands for the recurring work: workflow migrations, backfill
  validation and reconciliation queries. I keep their context and token use tight so the
  output stays accurate and cost-efficient. It sped up delivery and onboarding across the
  migration and backfill work.

## Result

- **350+** SLA/SLE-critical workflows migrated from UC4 (Automic) to DLS
- **~975B** and **~300B** rows reconciled end to end across 3 ZeroETL Oracle replication pipelines
- **13.2M**-row (zero-gap) and **12.4B**-row AES-encrypted backfills, fully validated
- Pipelines on a petabyte-scale platform with tables of **~2 trillion** records

## What I'd do differently

TODO-SAGAR: One thing you'd change if you did this work again.

## In the machine

The pipeline on this site works the same way: each source has a YAML data contract, every
run reconciles its row counts, and `foundry backfill` rebuilds any range of hours and can
run twice without duplicating a row.
