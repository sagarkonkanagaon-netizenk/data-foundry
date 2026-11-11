---
slug: case-ebay-orchestration-migration
order: 3
kind: case-study
scene: migration
codename: CASE 03
title: "Moving 300+ pipelines to a new orchestrator"
status: Case study · eBay
problem: "Migrating 300+ production pipelines from UC4 (Automic) to the in-house DLS platform, plus a two-year backfill."
diagram: [UC4 (Automic), Migration, DLS platform, 2-year backfill]
stack: [UC4 / Automic, DLS]
impact:
  value: "300+"
  label: "pipelines migrated from UC4 to DLS"
links: []
draft: false
---

<!--
  Case study rules: only the result above is confirmed. Every line that starts with
  TODO-SAGAR is a question for Sagar. Those lines show on preview builds and are left
  out of the live site, so an unanswered question never reads as a fact. Replace a
  TODO-SAGAR line with your answer (plain text) to publish it.
-->

## Context

Senior Data Engineer at eBay, January 2026 to now.

TODO-SAGAR: Which team, and who used these pipelines' data? (Keep it non-confidential: no internal system names beyond DLS, no volumes you can't share.)

## The problem

TODO-SAGAR: Why did the pipelines have to leave UC4, and what made it hard? For example the deadline, the dependencies between jobs, or what couldn't break while you moved them.

## What I did

Migrated 300+ production pipelines from UC4 (Automic) to the in-house DLS platform, and ran a two-year historical backfill.

TODO-SAGAR: How did you do it? How the pipelines were grouped and ordered, how you proved a migrated pipeline matched the old one, and how cutover and rollback worked. (Your résumé also mentions splitting workflows along job-plan dependencies, versioned JARs with rollback, data contract checks before onboarding, and PagerDuty on-call. Confirm the ones that belong here.)

TODO-SAGAR: How was the two-year backfill run and checked for completeness?

## Result

- **300+** production pipelines migrated from UC4 (Automic) to DLS
- A **two-year** historical backfill

TODO-SAGAR: Anything measurable after the move that you can share, such as incidents, run times or effort saved? Leave this out if you don't have a number.

## What I'd do differently

TODO-SAGAR: One thing you'd change if you did this migration again.

## Stack

TODO-SAGAR: The rest of the stack you used on this work. The tools listed at the bottom of this page come from the result above.
