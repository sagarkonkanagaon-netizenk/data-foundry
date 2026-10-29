---
id: intake
order: 1
label: "01 · Intake"
title: Intake ports
# Accent colour of this stage in the machine (CSS hex).
color: "#7fd8ff"
summary: "Four raw sources stream in from the edges, each in its own colour."
# Particle streams entering the machine. Each nods to a domain I've worked in.
sources:
  - id: orders
    label: Orders
    domain: E-commerce
    color: "#7fd8ff"
  - id: telemetry
    label: Sensor telemetry
    domain: Industrial IoT
    color: "#9d8cff"
  - id: transactions
    label: Transactions
    domain: Finance
    color: "#c7b8ff"
  - id: clickstream
    label: Clickstream
    domain: Automotive
    color: "#5fe0d0"
project: case-clickstream-medallion
draft: true
---

Every pipeline starts with sources you do not control. Orders arrive from an API that
changes without notice, chillers report temperature every few seconds over flaky
networks, loan transactions land as nightly files, and clickstream comes in bursts.

The intake's only job is to **accept everything and lose nothing**: capture the raw
payload, the arrival time and where it came from. Judgement happens later.
