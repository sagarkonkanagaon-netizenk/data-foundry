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
stack: [Spark]
impact:
  value: "10,000+"
  label: "IoT devices"
links: []
draft: false
---

<!--
  Case study rules: only the result above is confirmed. Every line that starts with
  TODO-SAGAR is a question for Sagar. Those lines show on preview builds and are left
  out of the live site. Replace a TODO-SAGAR line with your answer to publish it.
-->

## Context

Senior Data Engineer at RedBlackTree, on a client engagement for Trane Technologies, August 2025 to January 2026.

TODO-SAGAR: What did the platform do with the telemetry, and who used it? Keep it to what Trane would be comfortable seeing in public.

## The problem

TODO-SAGAR: How did the schema change, and what broke (or would have broken) when it did? For example firmware updates adding or renaming fields.

## What I did

Implemented schema evolution for telemetry from 10,000+ IoT devices.

TODO-SAGAR: How did it work? Where new fields landed, how type changes were handled, and how you knew nothing was lost. (Your résumé mentions dynamic schema inference, Parquet on HDFS, partitioned Hive tables, and validation and lineage. Confirm the ones that belong here.)

## Result

- Schema evolution across **10,000+** IoT devices

TODO-SAGAR: What changed after it shipped? For example redeploys avoided or failures prevented. Leave this out if you don't have a number. (The site used to say "zero redeploys"; only keep that if it's true.)

## What I'd do differently

TODO-SAGAR: One thing you'd change if you built it again.

## Stack

TODO-SAGAR: The rest of the stack you used on this work. The tools listed at the bottom of this page come from the result above.

## In the machine

The machine's **Schema drift** drill, and the real schema registry in `/pipeline`, use the same idea on a public stream.
