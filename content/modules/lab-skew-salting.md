---
slug: lab-skew-salting
order: 6
kind: lab
scene: salting
codename: LAB 03
title: "Taming a skewed join with salting"
status: Mini project
problem: "One customer owns most of the rows, so one Spark task gets most of the join, and a job that should take minutes runs for an hour on a single straggler."
diagram: [Skewed fact table, Detect hot keys, Salt hot keys (N buckets), Explode dimension × N, Balanced join]
stack: [PySpark, Spark UI, AQE skew join, Broadcast joins]
impact:
  value: "1 → N"
  label: "tasks sharing the hot key"
links: []
draft: false
---

**The problem.** Joins shuffle rows by key. When one key is far larger than the rest
(a marketplace's biggest seller, a default `null` id, a test account), every one of
its rows lands in the same partition and one task does most of the work while the
cluster waits.

**The approach.** First, measure: find hot keys from the task metrics and a quick
`groupBy` count. Then try the cheap fixes: broadcast the small side, or let Adaptive
Query Execution split the skewed partition. When neither fits, **salt** the hot keys:
add a random bucket `0..N-1` to the large side and replicate the matching rows on the
small side N times, so the hot key spreads across N tasks.

**What it shows.** The same join, before and after, with the Spark UI task timeline
going from one long bar to an even block, and the rule of thumb for when salting is
worth its extra shuffle.
