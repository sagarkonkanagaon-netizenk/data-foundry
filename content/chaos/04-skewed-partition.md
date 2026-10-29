---
id: skewed-partition
order: 4
label: Skewed partition
stage: spark
severity: warning
detect: "task 187 at 41 min · p50 is 22 s · key seller_id=0 holds 31% of rows"
diagnose: "hot key skew on join orders ⋈ sellers"
heal: "salting hot key ×16 · AQE skew join on · stage time 41m → 2m"
---

One executor is still grinding while the rest sit idle. A single key (a default
`seller_id = 0`) owns almost a third of the rows, so one task does a third of the work.

The sentinel spots the straggler from task metrics, finds the hot key, and re-runs the
stage with the key salted across 16 buckets and adaptive skew-join enabled.
