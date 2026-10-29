---
slug: phoenix
order: 2
kind: product
codename: PHOENIX
title: "Phoenix: AI self-healing test automation"
status: Prototype
problem: "Pipeline tests break on harmless changes, and engineers spend hours triaging failures that a machine could classify."
diagram: [Failing test + run context, LLM diagnosis, Fix proposal, Verify + open PR]
stack: [Python, pytest, LLM API, GitHub Actions, Delta Lake]
impact:
  value: "TBD"
  label: "test failures auto-triaged"
links:
  - label: Repo
    href: "#"
draft: true
---

Phoenix watches failing data tests, gathers context (the diff, the schema history, the
failing rows) and asks a model to classify the failure: real regression, expected
change, or flaky. For expected changes it proposes the updated assertion and opens a
PR; for regressions it writes the diagnosis a human would have had to dig for.

The AI Sentinel in the machine above is Phoenix's idea made visible.

**Status:** placeholder. Replace this with your own write-up.
