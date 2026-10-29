---
heading: Instrument panel
intro: "Every tool on the panel has been run in production. Needle = depth of use (1 to 5), readout = years."
# depth: 1 = used it, 3 = shipped production work, 5 = the person people ask.
# years: rounded, minimum 1.
groups:
  - name: Compute
    dials:
      - { label: PySpark, depth: 5, years: 6 }
      - { label: Spark SQL, depth: 5, years: 6 }
      - { label: Hadoop / Hive, depth: 5, years: 6 }
      - { label: Databricks, depth: 4, years: 1 }
  - name: Storage
    dials:
      - { label: HDFS, depth: 4, years: 6 }
      - { label: Delta Lake, depth: 4, years: 1 }
      - { label: ADLS Gen2, depth: 3, years: 5 }
      - { label: BigQuery, depth: 3, years: 1 }
  - name: Orchestration
    dials:
      - { label: Azure Data Factory, depth: 4, years: 5 }
      - { label: UC4 / Automic, depth: 4, years: 1 }
      - { label: Airflow / Composer, depth: 3, years: 1 }
  - name: Cloud
    dials:
      - { label: Azure, depth: 4, years: 5 }
      - { label: GCP, depth: 3, years: 1 }
      - { label: On-prem Hadoop, depth: 5, years: 6 }
  - name: CI/CD
    dials:
      - { label: Git, depth: 4, years: 6 }
      - { label: Jenkins, depth: 3, years: 2 }
      - { label: PagerDuty, depth: 3, years: 1 }
  - name: AI
    dials:
      - { label: AI pipeline docs, depth: 3, years: 1 }
      - { label: LLM APIs, depth: 2, years: 1 }
      - { label: Self-healing pipelines, depth: 2, years: 1 }
draft: true
---
