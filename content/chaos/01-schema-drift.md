---
id: schema-drift
order: 1
label: Schema drift
# Which chamber visibly breaks.
stage: bronze
severity: warning
# Floating log lines, in order. Keep each under ~70 characters.
detect: "an event arrives with a field the contract doesn't know"
diagnose: "registry: new field → recorded once in ops/schema_changes"
heal: "kept in silver.extras · run continues · no code change"
# Where /pipeline really handles it.
code:
  - { label: "evolution.py · detect()", path: "pipeline/foundry/evolution.py" }
  - { label: "silver.py · extras column", path: "pipeline/foundry/silver.py" }
  - { label: "bronze.yaml · known fields", path: "pipeline/contracts/bronze.yaml" }
---

Wikimedia's event schema allows extra fields, and they do appear. Each run compares the
fields it sees with a registry seeded from the upstream schema. A new field, or a known
field with a new type, is recorded once and the run keeps going.

New top-level fields land in silver's `extras` column, so nothing is lost and no code
changes. A known field whose new type no longer casts goes to quarantine instead.
