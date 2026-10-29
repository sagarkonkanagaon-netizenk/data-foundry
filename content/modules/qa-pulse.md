---
slug: qa-pulse
order: 4
kind: product
codename: QA PULSE
title: QA Pulse
status: Prototype
problem: "Data quality results were scattered across job logs, so nobody could tell if quality was getting better or worse."
diagram: [DQ check results, Metrics store, Trend + anomaly model, Pulse dashboard]
stack: [PySpark, Delta Lake, Databricks SQL, Python]
impact:
  value: "TBD"
  label: "tables monitored"
links:
  - label: Repo
    href: "#"
draft: true
---

QA Pulse collects every data quality check result into one place and turns it into a
heartbeat per table: pass rate over time, newly failing checks, and anomalies in
volume and freshness.

**Status:** placeholder. Replace this with your own write-up.
