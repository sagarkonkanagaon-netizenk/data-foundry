---
heading: Flight log
intro: "One entry per mission. Most recent first."
# Dates are YYYY-MM. Use "present" for a current role.
entries:
  - company: eBay
    role: Senior Data Engineer
    domain: E-commerce
    start: "2026-01"
    end: present
    location: Bengaluru
    lines:
      - "Migrated 300+ production pipelines from UC4 (Automic) to Data Lake Studio, rebuilding them on the new orchestration layer."
      - "Ran a two-year historical backfill across high-volume pipelines with full completeness checks."
      - "On-call via PagerDuty: diagnosing Spark and Hive failures before they reach downstream analytics."
  - company: Trane Technologies
    client: RedBlackTree
    role: Senior Data Engineer (client engagement)
    domain: Industrial IoT
    start: "2025-08"
    end: "2026-01"
    location: Bengaluru
    lines:
      - "Built Hadoop–Spark pipelines for telemetry from 10,000+ connected HVAC devices."
      - "Implemented schema evolution so firmware changes never forced a pipeline redeploy."
      - "Set up validation, lineage and metadata governance for compliance and audit."
  - company: Tiger Analytics
    role: Data Engineer
    domain: Automotive
    start: "2024-11"
    end: "2025-08"
    location: Bengaluru
    lines:
      - "Cut Spark pipeline runtime by 35% with partition pruning, caching, broadcast joins and AQE."
      - "Built a Bronze–Silver–Gold lakehouse on Azure Databricks and Delta Lake with SCD Type 1 & 2."
      - "Replaced full loads with watermark-based incremental ingestion on ADF and Cloud Composer."
  - company: XL Dynamics
    role: Associate Data Engineer
    domain: Finance
    start: "2020-10"
    end: "2024-08"
    location: Mumbai
    lines:
      - "Built ETL over 20M+ mortgage, loan and risk records with full lineage and audit controls."
      - "Designed DQ rule frameworks and reconciliation checks across every pipeline stage."
      - "Automated ingestion, scheduling and alerting with shell scripts, cutting manual ops work by 40%."
draft: false
---
