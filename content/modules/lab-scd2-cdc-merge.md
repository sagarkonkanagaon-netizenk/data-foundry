---
slug: lab-scd2-cdc-merge
order: 5
kind: lab
scene: scd2
codename: LAB 02
title: "SCD Type 2 from a CDC feed"
status: Mini project
problem: "A customer moves city and the old address is overwritten, so last quarter's sales by region quietly change every time someone re-runs the report."
diagram: [CDC change feed, Hash of tracked columns, Delta MERGE, Expire old version, Insert new version]
stack: [PySpark, Delta Lake MERGE, Surrogate keys, SQL]
impact:
  value: "1"
  label: "current row per key, full history kept"
links: []
draft: false
---

**The problem.** Dimension tables change. Overwriting in place (SCD Type 1) is right
for typo fixes and wrong for anything history depends on, such as region, tier or
price. Reports built on a Type 1 dimension rewrite the past.

**The approach.** Read the CDC feed, hash the tracked columns, and compare against the
current version of each key. One Delta `MERGE` expires changed rows (`valid_to`,
`is_current = false`) and a second pass inserts the new versions with fresh surrogate
keys. Unchanged rows are untouched, and out-of-order changes for the same key are
ordered by their source timestamp before the merge.

**What it shows.** Exactly one current row per business key, every previous version
kept with its validity window, and a merge that does nothing when run twice on the
same batch.
