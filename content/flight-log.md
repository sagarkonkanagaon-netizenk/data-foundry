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
      - "Migrated 350+ SLA- and SLE-critical workflows from UC4 (Automic) to DLS (Data Lake Studio), split into modular, independently schedulable workflows."
      - "Built 3 ZeroETL Oracle replication pipelines from scratch and reconciled ~975B-row and ~300B-row datasets end to end."
      - "Ran AES-encrypted backfills into a new internal database: a zero-gap 13.2M-row backfill and a 12.4B-row backfill with full completeness validation."
      - "Moved Scala Spark UDF JARs onto ADLC, eBay's internal CI/CD for Hadoop apps: commit-triggered builds, CVE scanning, image registry push, artifacts copied to Hadoop."
      - "Govern PII, lineage and data contracts in BDP; own SLA/SLE reliability through iDO monitoring, Zeta and PagerDuty on ~2 trillion-row tables."
      - "Use AI coding assistants with custom skills and slash commands for migrations, backfill validation and reconciliation queries, keeping context and token use tight."
  - company: RedBlackTree
    role: Senior Data Engineer
    domain: Industrial IoT
    start: "2025-08"
    end: "2026-01"
    location: Bengaluru
    lines:
      - "Built Azure Databricks, PySpark and Hadoop pipelines for connected IoT devices into ADLS Gen2 and partitioned Hive tables."
      - "Organised telemetry into Bronze, Silver and Gold Delta Lake layers, orchestrated by Azure Data Factory."
      - "Zero-downtime schema evolution for 10,000+ telemetry streams: upstream changes flowed through with no redeploy."
  - company: Tiger Analytics
    role: Data Engineer
    domain: Automotive
    start: "2024-11"
    end: "2025-08"
    location: Bengaluru
    lines:
      - "Cut Spark pipeline runtime by 35% with partition pruning, caching, broadcast joins and AQE."
      - "Built a Bronze–Silver–Gold lakehouse on Azure Databricks, Delta Lake and ADLS Gen2 with SCD Type 1 & 2."
      - "Replaced full reloads with watermark-based incremental ingestion on Azure Data Factory."
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
