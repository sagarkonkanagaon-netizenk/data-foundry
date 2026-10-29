---
id: spark
order: 3
label: "03 · Spark core"
title: Spark core
color: "#9d8cff"
summary: "Rings of executors. Records split into partitions, shuffle, and rejoin."
project: case-automotive-lakehouse
draft: false
---

The core is the compute: a Spark cluster on Databricks. Each ring is a set of
executors, each node a task working on one partition. When a job joins or aggregates,
records **shuffle** across the rings (the arcs) so that matching keys meet on the same
executor, then the results rejoin.

Most of the performance work I do lives here: choosing partition keys, killing
accidental shuffles, salting skewed joins, broadcasting small dimensions, and sizing
clusters so the bill matches the value of the job.

At Tiger Analytics this work cut distributed pipeline runtimes by **35%** through
partition pruning, caching, broadcast joins and Adaptive Query Execution.

**Built with:** PySpark, Spark SQL, Azure Databricks, AQE, Hive.
