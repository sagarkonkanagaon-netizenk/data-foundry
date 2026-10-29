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
  - id: supply
    label: Supply chain
    domain: Automotive
    color: "#5fe0d0"
project: case-ebay-orchestration-migration
draft: false
---

Every pipeline starts with sources you do not control, and each stream here is one
I have actually run: marketplace events at eBay, telemetry from 10,000+ connected HVAC
units at Trane, mortgage and loan records at XL Dynamics, and automotive
manufacturing and supply-chain feeds at Tiger Analytics.

The intake's only job is to **accept everything and lose nothing**: capture the raw
payload, the arrival time and where it came from. Judgement happens later.
