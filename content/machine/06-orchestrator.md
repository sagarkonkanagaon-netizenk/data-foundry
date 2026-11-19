---
id: orchestrator
order: 6
label: "06 · Orchestrator"
title: Orchestrator
color: "#7fd8ff"
summary: "A holographic DAG above the machine. Each node lights as its task runs."
project: case-ebay-orchestration-migration
# Tasks shown in the floating DAG, in run order. These are the real stages of
# pipeline/foundry/run.py; the machine replays the latest run's stages on them.
tasks: [extract, bronze, schema, silver, gold, quality, retention]
draft: false
---

The DAG above replays the latest real run: GitHub Actions runs the pipeline in
`/pipeline` every hour, one run at a time, and each node lights for as long as that
stage really took. A failed stage stays red, and the stages after it never run.

Nothing in a pipeline runs on its own. The orchestrator decides **what runs, in what
order, and what happens when something fails**: retries with backoff, sensors that
wait for late files, SLAs that page a human only when it matters.

At eBay I migrated **350+ SLA-critical workflows** from UC4 (Automic) to DLS (Data Lake
Studio), watch them in iDO, and carry the PagerDuty pager when they misbehave. Before
that: Azure Data Factory triggers at Tiger Analytics and RedBlackTree, shipped through
Jenkins.

**Built with:** UC4 / Automic, DLS, iDO, ADF, ADLC CI/CD, Jenkins, PagerDuty.
