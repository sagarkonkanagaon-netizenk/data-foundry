---
id: null-storm
order: 3
label: Null storm
stage: silver
severity: error
detect: "a required field arrives null on many rows"
diagnose: "rows fail the silver contract with reason null:<column>"
heal: "rows quarantined · above 25% the run fails before writing"
code:
  - { label: "silver.py · typed()", path: "pipeline/foundry/silver.py" }
  - { label: "silver.yaml · max_reject_rate", path: "pipeline/contracts/silver.yaml" }
  - { label: "quality.py · null_rate", path: "pipeline/foundry/quality.py" }
---

Every silver column is read and validated from the contract. A row missing a required
value, or carrying one that won't cast, goes to `silver.quarantine` with the reason
attached, never silently dropped.

If more than a quarter of a run's rows are rejected, the contract fails the run before
silver is written, so a broken source can't overwrite good data.
