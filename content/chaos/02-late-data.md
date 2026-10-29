---
id: late-data
order: 2
label: Late data
stage: silver
severity: warning
detect: "telemetry.site_14 arriving 47 min late · watermark breached"
diagnose: "upstream gateway backlog, not data loss · 3 partitions affected"
heal: "extending watermark · reprocessing 3 partitions via MERGE"
---

A site gateway went offline and then flushed 47 minutes of sensor readings at once.
A naive pipeline would drop them as "too late" or double-count them.

The sentinel identifies which date partitions the late records belong to, widens the
watermark for that source only, and re-merges just those partitions so Gold stays
correct without a full rebuild.
