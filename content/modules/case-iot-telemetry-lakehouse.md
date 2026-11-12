---
slug: case-iot-telemetry-lakehouse
order: 1
kind: case-study
scene: telemetry
codename: CASE 01
title: "Schema evolution for 10,000+ IoT devices"
status: Case study · RedBlackTree for Trane
problem: "Schema evolution for telemetry from 10,000+ connected IoT devices."
diagram: ["10,000+ IoT devices", Telemetry, Schema evolution, Analytics]
stack: [PySpark, Spark SQL, Hadoop, HDFS, Hive, Parquet]
impact:
  value: "10,000+"
  label: "IoT devices"
links: []
draft: false
---

<!--
  Case study rules: every fact on this page comes from Sagar's résumé (Senior Data
  Engineer, November 2026). Lines that start with TODO-SAGAR are still open questions:
  they show on preview builds and are left out of the live site.
-->

## Context

Senior Data Engineer at RedBlackTree, August 2025 to January 2026, for the client Trane
Technologies (HVAC and refrigeration). I built an industrial IoT telemetry platform:
Hadoop and Spark pipelines for HVAC telemetry from 10,000+ connected devices, feeding
equipment-health monitoring and predictive-maintenance analytics.

## The problem

Device firmware updates add and change telemetry fields. A pipeline with a fixed
schema has to be redeployed for each change, or it breaks the tables downstream.

## What I did

- **Schema evolution.** Dynamic schema inference let new or modified fields from
  firmware updates flow through without a pipeline redeploy or downstream breakage.
- **Transformations.** PySpark jobs on Parquet datasets in HDFS, with window functions,
  aggregations, broadcast joins and schema enforcement, loading partitioned Hive tables.
- **Traceability.** Data validation, lineage tracking and metadata capture built into
  the ingestion and transformation stages, for end-to-end audit.
- **Reuse.** With the product and analytics teams, I turned common Spark transformations
  into reusable ETL components, which cut down ad-hoc query load.

## Result

- Telemetry from **10,000+** IoT devices
- Firmware schema changes absorbed **without redeploying** the pipeline

## What I'd do differently

TODO-SAGAR: One thing you'd change if you built it again.

## In the machine

The machine's **Schema drift** drill, and the real schema registry in `/pipeline`, use
the same idea on a public stream.
