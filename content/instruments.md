---
heading: Instrument panel
intro: "Every tool on the panel has been run in production. Needle = depth of use (1 to 5), readout = years."
# depth: 1 = used it, 3 = shipped production work, 5 = the person people ask.
# years: rounded, minimum 1.
groups:
  - name: Compute
    dials:
      - { label: PySpark, depth: 5, years: 5 }
      - { label: Spark SQL, depth: 5, years: 5 }
      - { label: Hadoop / Hive, depth: 5, years: 5 }
      - { label: Databricks, depth: 4, years: 1 }
      - { label: Scala (Spark UDFs), depth: 3, years: 1 }
  - name: Storage
    dials:
      - { label: HDFS, depth: 4, years: 5 }
      - { label: Delta Lake, depth: 4, years: 1 }
      - { label: ADLS Gen2, depth: 3, years: 5 }
      - { label: Oracle / ZeroETL, depth: 3, years: 1 }
  - name: Orchestration
    dials:
      - { label: Azure Data Factory, depth: 4, years: 5 }
      - { label: UC4 / Automic, depth: 4, years: 1 }
      - { label: iDO / BDP, depth: 3, years: 1 }
  - name: Platforms
    dials:
      - { label: Azure, depth: 4, years: 5 }
      - { label: Multi-cluster Hadoop, depth: 4, years: 1 }
      - { label: On-prem Hadoop, depth: 5, years: 5 }
  - name: CI/CD
    dials:
      - { label: Git, depth: 4, years: 5 }
      - { label: ADLC CI/CD, depth: 3, years: 1 }
      - { label: Jenkins, depth: 3, years: 1 }
      - { label: PagerDuty, depth: 3, years: 1 }
  - name: AI-assisted engineering
    dials:
      - { label: AI coding assistants, depth: 3, years: 1 }
      - { label: Custom skills & commands, depth: 3, years: 1 }
      - { label: Context & token tuning, depth: 3, years: 1 }
draft: false
---
