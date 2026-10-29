---
id: sentinel
order: 7
label: "07 · Sentinel"
title: AI Sentinel
color: "#e8f6ff"
summary: "A drifting orb that scans each chamber, diagnoses anomalies and repairs the flow."
project: case-ebay-orchestration-migration
draft: false
---

The sentinel is the idea I care most about: pipelines that **notice their own
failures and propose the fix**. It reads run metadata, row counts, schema history and
DQ results, spots what changed, and either applies a safe, pre-approved remedy or
hands a human a diagnosis instead of a stack trace.

It is also what on-call should feel like. At eBay I carry the PagerDuty pager for
pipelines I migrated, and the playbook is always the same: detect, diagnose from the
run's own evidence, apply the smallest safe fix, then make sure it cannot page twice.
