---
slug: case-finance-reconciliation
order: 4
kind: case-study
codename: CASE 04
title: "Validating and reconciling 20M+ records"
status: Case study · XL Dynamics
problem: "Validation and reconciliation over 20M+ records."
diagram: [Source records, Validation, Reconciliation, Trusted output]
stack: []
impact:
  value: "20M+"
  label: "records validated and reconciled"
links: []
draft: false
---

<!--
  Case study rules: only the result above is confirmed. Every line that starts with
  TODO-SAGAR is a question for Sagar. Those lines show on preview builds and are left
  out of the live site. Replace a TODO-SAGAR line with your answer to publish it.
-->

## Context

Associate Data Engineer at XL Dynamics, October 2020 to August 2024.

TODO-SAGAR: What were the records (the business domain), and who relied on them? Nothing confidential.

## The problem

TODO-SAGAR: What went wrong without validation and reconciliation? For example mismatched totals, missing rows or late corrections.

## What I did

Built validation and reconciliation over 20M+ records.

TODO-SAGAR: Which checks did you build, and where in the pipeline did they run? How were mismatches reported and fixed? (Your résumé mentions DQ rule frameworks, reconciliation at every pipeline stage, lineage and audit controls, and shell-script automation. Confirm the ones that belong here.)

## Result

- Validation and reconciliation over **20M+** records

TODO-SAGAR: Any outcome you can share, such as mismatches caught or manual checking removed? Leave this out if you don't have a number. (The site used to say "cut manual ops work by 40%"; only keep that if it's true.)

## What I'd do differently

TODO-SAGAR: One thing you'd change if you did it again.

## Stack

TODO-SAGAR: The tools you used on this work.

## In the machine

The real pipeline in `/pipeline` reconciles every run the same way: bronze rows must equal silver plus quarantine plus duplicates, and gold totals must equal silver.
