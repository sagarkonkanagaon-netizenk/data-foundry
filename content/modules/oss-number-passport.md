---
slug: oss-number-passport
order: 5
kind: open-source
scene: passport
codename: OSS 01
title: "Number Passport: prove where a reported number comes from"
status: Open source · v0.1.0 on PyPI
problem: "A regulator points at one number in a capital report and asks where it comes from. Answering means days of reading SQL, dbt and Spark code and running ad-hoc queries."
diagram: [Report cell, Gold, Silver, Bronze, Source rows, Sealed evidence pack]
stack: [Python, sqlglot, DuckDB, PostgreSQL, PySpark, dbt, Airflow, MCP, GitHub Actions]
impact:
  value: "to the cent"
  label: "every hop reconciled"
links:
  - label: GitHub
    href: https://github.com/sagarkonkanagaon-netizenk/number-passport
  - label: PyPI
    href: https://pypi.org/project/number-passport/
draft: false
---

**The problem.** BCBS 239 expects a bank to show how every reported risk number was
built, and to reconcile it back to source. In practice the logic is spread across SQL
models, dbt projects, PySpark jobs and Airflow DAGs, so one question from a regulator
can cost a team days.

**What it does.** `passport trace total_rwa` parses the real pipeline code (SQL, dbt,
PySpark translated step by step to SQL, Airflow for DAG and task), builds column-level
lineage for the measure, and walks it back to the source tables. At every hop it
reconciles the value the table holds, the value its code would produce if re-run, and
the effect of each filter, inner join, dedup and `HAVING`, each with its file and line.
The step effects add up exactly to the difference between input and output.

**What it caught.** On the sample bank pipeline it found a 3.1M manual adjustment that
was in the report but not in the warehouse, and said to the cent which rows each filter
and join removed on the way.

**Built for a bank's security review.** Read-only connections enforced twice, a privacy
guard that only lets aggregate queries through, every query logged with a SHA-256 of
its result, and an evidence pack (HTML, JSON, `replay.sql`, manifest) that
`passport verify` can re-check later for tampering and code drift.

**Engineering.** CLI, MCP server and agent skill for AI assistants. CI runs lint, mypy
and the full suite on Python 3.10 to 3.13 against a real PostgreSQL service and a real
Spark job, and releases go to PyPI by trusted publishing. Apache 2.0.
