---
slug: case-iot-telemetry-lakehouse
order: 1
kind: case-study
scene: telemetry
codename: CASE 01
title: "Industrial IoT telemetry platform"
status: Case study · Trane
problem: "Telemetry from 10,000+ connected HVAC units kept changing shape with every firmware update, and every change risked breaking the pipelines behind equipment-health and predictive-maintenance analytics."
diagram: [10k+ HVAC devices, Parquet on HDFS, PySpark + schema evolution, Partitioned Hive tables, Health + maintenance analytics]
stack: [PySpark, Spark SQL, Hadoop, HDFS, Hive, Parquet, Python]
impact:
  value: "10k+"
  label: "devices, zero-redeploy schema changes"
links: []
draft: false
---

**Context.** Trane Technologies runs HVAC and refrigeration equipment that reports
telemetry continuously. The platform turns that stream into real-time equipment
health monitoring and predictive maintenance analytics. I worked on it as a Senior
Data Engineer on a RedBlackTree client engagement (Aug 2025 – Jan 2026).

**What I built.** Hadoop–Spark pipelines that process high-volume telemetry from
10,000+ devices. PySpark jobs on Parquet in HDFS apply window functions, aggregations,
broadcast joins and schema enforcement before loading partitioned Hive tables.

**Hard part.** Firmware updates add or change fields without warning. I implemented
schema evolution with dynamic schema inference, so pipelines adapt to new or modified
fields and stay fully compatible downstream **without being redeployed**. This is the
Schema Drift scenario in the machine above.

**Governance.** Data validation, lineage tracking and metadata governance across
ingestion and transformation, giving end-to-end traceability for compliance and audit.

**Result.** Standardised Spark transformation patterns across the platform, which
reduced the ad-hoc query load on the team.
