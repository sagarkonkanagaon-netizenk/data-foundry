---
id: skewed-partition
order: 4
label: Skewed partition
stage: spark
severity: warning
detect: "one key holds most rows · one task does most of the work"
diagnose: "hot key found from a quick groupBy count"
heal: "salt the hot key across N buckets · balanced join"
code:
  - { label: "spark-pipeline-labs · salting.py", path: "https://github.com/sagarkonkanagaon-netizenk/spark-pipeline-labs/blob/main/labs/salting.py" }
---

The hourly pipeline doesn't need this: a few thousand rows an hour can't skew a join.
The fix is shown where it can be tested instead, in a separate lab with its own tests.

When one key owns most of the rows, salting adds a random bucket to the large side and
replicates the matching rows on the small side, so the hot key spreads across tasks.
