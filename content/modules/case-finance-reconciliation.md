---
slug: case-finance-reconciliation
order: 4
kind: case-study
codename: CASE 04
title: "Validating and reconciling 20M+ records"
status: Case study · XL Dynamics
problem: "Validation and reconciliation over 20M+ records."
diagram: [Source records, Validation, Reconciliation, Trusted output]
stack: [Python, PySpark, SQL, Azure Data Factory, Hive, Shell, PostgreSQL, Tableau]
impact:
  value: "20M+"
  label: "records validated and reconciled"
links: []
draft: false
---

<!--
  Case study rules: every fact on this page comes from Sagar's résumé (Senior Data
  Engineer, November 2026). Lines that start with TODO-SAGAR are still open questions:
  they show on preview builds and are left out of the live site.
-->

## Context

Associate Data Engineer at XL Dynamics, October 2020 to August 2024, in finance
(mortgage and loan processing). I built ETL pipelines that ingested and transformed
mortgage, loan and risk data from several transactional systems: 20M+ financial records.

## The problem

Financial reporting is only as good as the data under it. Records came from several
transactional systems, and each one had to be accurate from the source all the way to
the reporting layer.

## What I did

- **Validation and reconciliation.** Data validation rules and reconciliation checks
  across the pipeline stages, so the reporting layer matched the source.
- **Lineage and audit.** Lineage and audit controls over the 20M+ records.
- **Transformations.** Hive and PySpark jobs for cleansing, deduplication, aggregation
  and SCD Type 1 and Type 2 handling on loan and risk dimension tables.
- **Automation.** Shell scripts for file ingestion, scheduling and alerting, which cut
  manual operational effort by 40%.
- **Design and reporting.** HLD and LLD design documents for the finance data platform,
  and Tableau dashboards for loan-performance and risk KPIs.

## Result

- Validation and reconciliation over **20M+** financial records
- Manual operational effort cut by **40%**

## What I'd do differently

TODO-SAGAR: One thing you'd change if you did it again.

## In the machine

The real pipeline in `/pipeline` reconciles every run the same way: bronze rows must
equal silver plus quarantine plus duplicates, and gold totals must equal silver.
