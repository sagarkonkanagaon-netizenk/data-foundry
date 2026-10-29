---
slug: rewind
order: 1
kind: product
codename: REWIND
title: "Rewind: a black box for data pipelines"
status: In development
problem: "When a pipeline produces a wrong number, nobody can say what it saw, what it ran, or what changed since yesterday."
# Architecture mini-diagram: left-to-right chain of nodes.
diagram: [Airflow / Spark listeners, Run event log (Delta), Lineage + diff engine, Replay console]
stack: [Python, Spark listeners, Delta Lake, Airflow, FastAPI]
impact:
  value: "TBD"
  label: "mean time to root cause"
links:
  - label: Repo
    href: "#"
  - label: Write-up
    href: "#"
draft: true
---

Aircraft carry a flight recorder so that after an incident you can replay exactly what
happened. Pipelines almost never do. Rewind records every run: input snapshots (as
Delta versions), the code and config hash, row counts per stage, schema at each hop,
and DQ results.

When a Gold number looks wrong, you scrub back through the timeline, diff today's run
against the last good one, and see the exact stage where things diverged.

**Status:** placeholder. Replace this with your own write-up.
