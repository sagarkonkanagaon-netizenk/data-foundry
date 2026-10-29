---
slug: case-iot-telemetry-lakehouse
order: 5
kind: case-study
codename: CASE 01
title: "Industrial IoT telemetry lakehouse"
status: Case study · Trane Technologies
problem: "HVAC equipment telemetry arrived late, duplicated and in mixed formats, so efficiency reports could not be trusted."
diagram: [Device gateways, ADF ingestion, Bronze / Silver / Gold on Delta, BI + alerts]
stack: [Azure Data Factory, Databricks, PySpark, Delta Lake, Azure DevOps]
impact:
  value: "TBD"
  label: "faster daily refresh"
links:
  - label: Write-up
    href: "#"
draft: true
---

**Context.** Describe the system, the scale (devices, rows per day) and who used the
output.

**What I built.** A medallion lakehouse on Databricks: raw telemetry landed in Bronze,
deduplicated and late-arrival-aware Silver tables, and Gold aggregates for equipment
efficiency.

**Hard part.** Write the one problem that took real thinking.

**Result.** Put the measured outcome here.

**Status:** placeholder framing. Replace with the real story; keep anything
confidential vague.
