---
slug: lab-idempotent-backfill
order: 7
kind: lab
scene: backfill
codename: LAB 04
title: "A backfill you can run twice"
status: Mini project
problem: "A two-year backfill fails on day 412, someone restarts it from the top, and now half the history is loaded twice."
diagram: [Date range planner, One partition per run, replaceWhere overwrite, Row-count audit, Resume from checkpoint]
stack: [PySpark, Delta Lake replaceWhere, Airflow, Python]
impact:
  value: "1×"
  label: "rows per day, however many reruns"
links: []
draft: false
---

**The problem.** Backfills are long, and long jobs fail. If a run appends, every
restart duplicates whatever it had already loaded, and fixing that means a second,
riskier cleanup job.

**The approach.** Make each unit of work one partition (one day) and make the write an
**overwrite of exactly that partition** with Delta's `replaceWhere`. A planner splits
the range into days, records which ones finished, and resumes from the first gap. An
audit compares source and target row counts per day before marking it done.

**What it shows.** Kill the job anywhere, start it again, run the whole range twice:
the target ends up identical. It is the property a multi-year backfill, like the
two-year one I ran at eBay, cannot do without.
