---
id: sentinel
order: 7
label: "07 · Sentinel"
title: AI Sentinel
color: "#e8f6ff"
summary: "A drifting orb that scans each chamber, diagnoses anomalies and repairs the flow."
project: phoenix
draft: true
---

The sentinel is the idea I care most about: pipelines that **notice their own
failures and propose the fix**. It reads run metadata, row counts, schema history and
DQ results, spots what changed, and either applies a safe, pre-approved remedy or
hands a human a diagnosis instead of a stack trace.

It is the visual home for two of my projects: **Rewind**, a flight recorder that
captures every run so you can replay what happened, and **Phoenix**, AI-driven
self-healing test automation.
