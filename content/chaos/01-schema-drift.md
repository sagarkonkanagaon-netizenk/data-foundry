---
id: schema-drift
order: 1
label: Schema drift
# Which chamber visibly breaks.
stage: bronze
severity: warning
# Floating log lines, in order. Keep each under ~70 characters.
detect: "schema drift detected in orders.v3 → +discount_code (string)"
diagnose: "column is additive, nullable, no downstream contract broken"
heal: "auto-evolving schema · mergeSchema=true · replaying 1,204 rows"
---

The orders API added a `discount_code` field overnight. Bronze accepts it (raw is
raw), but the Silver write would fail on an unexpected column.

The sentinel compares the incoming schema against the registered contract, sees the
change is **additive and nullable**, evolves the Silver table and replays the batch.
A breaking change (a dropped or retyped column) would be held for a human instead.
