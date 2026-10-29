---
slug: swing-trading-tracker
order: 3
kind: product
codename: SWING
title: Swing Trading Tracker
status: Personal tool
problem: "Tracking swing trades across spreadsheets made it impossible to see which setups actually made money."
diagram: [Broker exports + market data, Ingestion jobs, Trade journal model, Dashboard]
stack: [Python, BigQuery, Airflow, Looker Studio]
impact:
  value: "TBD"
  label: "trades analysed"
links:
  - label: Repo
    href: "#"
draft: true
---

A personal pipeline that ingests broker exports and end-of-day prices, reconstructs
each position, and scores setups by win rate, expectancy and drawdown.

**Status:** placeholder. Replace this with your own write-up.
