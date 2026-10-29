---
id: null-storm
order: 3
label: Null storm
stage: silver
severity: error
detect: "null rate on transactions.amount 0.2% → 38% in 90s"
diagnose: "single producer (branch_api_v2) emitting nulls · DQ gate tripped"
heal: "quarantining 4,812 rows · alerting owner · Gold kept at last good"
---

Suddenly a third of transaction amounts are null. Loading them would corrupt every
revenue number downstream.

The DQ gate trips, the sentinel traces the nulls to one producer, routes those rows
to quarantine with the reason attached, and holds Gold at its last good version
(Delta time travel) until the source is fixed.
