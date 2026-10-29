---
heading: Instrument panel
intro: "Every tool on the panel has been run in production. Dial = depth of use (1 to 5), readout = years."
# depth: 1 = used it, 3 = shipped production work, 5 = the person people ask.
groups:
  - name: Compute
    dials:
      - { label: PySpark, depth: 5, years: 5 }
      - { label: Spark SQL, depth: 5, years: 5 }
      - { label: Databricks, depth: 4, years: 3 }
      - { label: Hadoop / Hive, depth: 3, years: 2 }
  - name: Storage
    dials:
      - { label: Delta Lake, depth: 4, years: 3 }
      - { label: BigQuery, depth: 4, years: 2 }
      - { label: HDFS, depth: 3, years: 2 }
  - name: Orchestration
    dials:
      - { label: Airflow, depth: 4, years: 3 }
      - { label: Cloud Composer, depth: 3, years: 2 }
      - { label: Azure Data Factory, depth: 4, years: 2 }
  - name: Cloud
    dials:
      - { label: Azure, depth: 4, years: 3 }
      - { label: GCP, depth: 3, years: 2 }
  - name: CI/CD
    dials:
      - { label: Jenkins, depth: 3, years: 3 }
      - { label: Azure DevOps, depth: 3, years: 2 }
      - { label: Git, depth: 4, years: 5 }
  - name: AI
    dials:
      - { label: LLM APIs, depth: 3, years: 1 }
      - { label: RAG, depth: 2, years: 1 }
      - { label: Self-healing pipelines, depth: 3, years: 1 }
draft: true
---
