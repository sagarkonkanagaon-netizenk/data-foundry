---
id: source-outage
order: 5
label: Source outage
stage: intake
severity: error
detect: "supply_chain feed silent for 6 min · expected ~2.1k ev/s"
diagnose: "upstream 503s · not a pipeline fault · freshness SLA at risk"
heal: "circuit open · serving last good snapshot · auto-backfill on recovery"
---

The supply-chain feed simply stops. Nothing in the pipeline is broken, but dashboards
are about to go stale.

The sentinel opens a circuit breaker so the pipeline stops retrying a dead endpoint,
marks Gold as "stale since 14:02" instead of quietly showing old numbers, and
schedules a backfill for the gap once the source returns.
