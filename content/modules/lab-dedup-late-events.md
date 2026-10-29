---
slug: lab-dedup-late-events
order: 4
kind: lab
scene: dedup
codename: LAB 01
title: "Exactly once, from an at-least-once stream"
status: Mini project
problem: "Event streams redeliver: retries, replays and mobile clients that come back online send the same event twice and an hour late, and every duplicate inflates a dashboard someone trusts."
diagram: [Kafka-style event stream, Event-time watermark, dropDuplicates within watermark, Late-row side table, Clean fact table]
stack: [PySpark Structured Streaming, Delta Lake, Watermarks, Python]
impact:
  value: "0"
  label: "duplicates after replaying the same hour twice"
links: []
draft: false
---

**The problem.** Most sources are at-least-once. A producer retries after a timeout, a
consumer restarts from an old offset, a phone buffers events offline and flushes them
later. Downstream, revenue double counts and session metrics drift.

**The approach.** Deduplicate on a stable event id within an **event-time watermark**,
so Spark keeps only a bounded window of ids in state instead of every id ever seen.
Rows that arrive after the watermark are not silently dropped: they land in a
late-rows table that a small batch job merges in, so nothing is lost and state stays
small.

**What it shows.** Replaying the same hour of input twice produces the same output
table, row for row. The watermark is the knob between correctness and state size, and
the late-rows table is what makes that trade-off safe.
