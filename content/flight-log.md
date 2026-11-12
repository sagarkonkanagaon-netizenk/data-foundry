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
      - "Migrated 300+ production pipelines, including SLA-critical jobs, from UC4 (Automic) to the in-house DLS (Data Lake Studio) platform."
      - "Delivered historical backfills, including a two-year reprocess, validating every dataset for completeness before release."
      - "PySpark and Spark SQL on a petabyte-scale Hadoop platform (tables of ~2 trillion records); on call via PagerDuty."
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
      - "Built validation, lineage and metadata capture into ingestion for end-to-end audit traceability."
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
      - "Built ETL over 20M+ mortgage, loan and risk records with lineage and audit controls."
      - "Implemented validation rules and reconciliation checks across pipeline stages, source to reporting."
      - "Automated ingestion, scheduling and alerting with shell scripts, cutting manual ops work by 40%."
draft: false
---
