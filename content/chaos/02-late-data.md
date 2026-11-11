---
id: late-data
order: 2
label: Late data
stage: silver
severity: warning
detect: "events for an earlier hour arrive in this run"
diagnose: "the run rebuilds every hour partition its events touch"
heal: "late hour rebuilt with replaceWhere · nothing counted twice"
code:
  - { label: "silver.py · build()", path: "pipeline/foundry/silver.py" }
  - { label: "lake.py · replace_hours()", path: "pipeline/foundry/lake.py" }
---

Events carry the time the change happened, and the pipeline partitions by that hour,
not by when the event arrived. A late event reopens its own hour.

Silver and gold are rebuilt for each hour a run touches, from every bronze row in that
hour, and written with Delta `replaceWhere` on exactly those partitions. Late rows are
merged in, duplicates are dropped on `event_id`, and re-running gives the same tables.
