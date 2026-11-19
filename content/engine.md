---
heading: Ask the engine
intro: "Ask about my work or the pipeline on this site. It answers only from what's written here and from the pipeline's run reports, shows its sources, and says so when it doesn't know."
greeting: "Engine online. I answer from this site and the pipeline's run reports, with sources. If they don't say, I'll tell you."
suggestions:
  - "What did Sagar do at eBay?"
  - "What happened in the pipeline's latest run?"
  - "How does the pipeline handle schema changes?"
  - "Is he open to new roles?"
# The small print under the console.
note: "Answers are written by an AI model from this site and the pipeline's run reports, and cite them. A model can still misread a source, so for anything important, email Sagar."
# The engine's answer when its sources don't cover a question. Its first words, exactly.
noAnswer: "I don't have that."
# Added under an answer that cites nothing, so an unsupported reply never passes as fact.
uncited: "(No source on this site backs that answer, so treat it with care.)"
# Instructions given to the model. Visitors never see this.
persona: >
  You are the Engine, the on-site assistant for Sagar's portfolio. You answer only
  from the numbered sources you are given: this site's content and the run reports
  of the real pipeline it runs. Speak about Sagar in the third person, concisely and
  concretely.
  When a visitor asks about hiring, availability or open roles, answer warmly and
  with confidence: he is actively looking, say what he is a strong fit for (with one
  or two concrete examples from the knowledge), and end by pointing them to the
  contact form, his email and his résumé. If a passage from the FAQ answers the
  question, give that answer, in your own words but without changing its facts.
draft: false
---

## Extra facts for the engine

Anything here is not shown as a section on the site, but the chat can use it. Only
confirmed facts belong here; open questions for Sagar are hidden from the chat.

- Job search: Sagar is actively looking for his next role, as of October 2026, and is
  happy to hear from recruiters and hiring managers.
- Roles he's after: Senior Data Engineer and similar data platform roles.
- Location: based in Bengaluru, India. For location preferences, notice period and
  start date, ask him directly by email.
- How to reach him: the contact form at the bottom of this site, or
  sagarkonkanagaon@gmail.com. He replies within two working days. His résumé is
  linked in the contact section (/resume.pdf).
- Employer label: at eBay he is a Senior Data Engineer; say "eBay" (no agency or payroll name).
- Summary: Senior Data Engineer with 5+ years building and operating petabyte-scale
  distributed batch pipelines and cloud lakehouses on Apache Spark, Hadoop, Azure
  Databricks and Delta Lake. Domains: e-commerce (eBay), industrial IoT (RedBlackTree),
  automotive (Tiger Analytics) and finance (XL Dynamics).
- Highlights: 350+ pipeline migrations at eBay; 975B-row data reconciliation (eBay); 12.4B-row
  AES-encrypted backfill (eBay); 35% faster Spark on Databricks (Tiger Analytics);
  petabyte-scale Spark and Hadoop on ~2 trillion-row tables (eBay).
- eBay detail: 350+ SLA/SLE-critical workflows migrated from UC4 (Automic) to DLS (Data Lake
  Studio); 3 ZeroETL Oracle replication pipelines built from scratch and reconciled across
  ~975B and ~300B rows; AES-encrypted backfills of 13.2M rows (zero-gap, after DistCP and
  path swaps) and 12.4B rows (full completeness validation) into a new internal database;
  PII, lineage and data-contract governance in BDP (Big Data Portal); SLA/SLE reliability
  through iDO (Intelligent Data Operation) monitoring, Zeta notebooks and PagerDuty on-call.
- ADLC: eBay's internal CI/CD for Hadoop applications. Sagar moved Scala Spark UDF JAR
  deployments from manual HDFS placement to ADLC: commit-triggered builds, CVE scanning,
  a push to the container image registry, and artifacts unpacked and copied to Hadoop.
- AI-assisted engineering: he uses AI coding assistants daily, with custom skills and
  slash commands for recurring work (workflow migrations, backfill validation,
  reconciliation queries), and manages context and token usage so output stays accurate
  and cost-efficient. It sped up delivery and onboarding across his migration and
  backfill work.
- Daily production use: PySpark, Spark SQL, Apache Spark, Scala (Spark UDFs), Hive,
  Hadoop / HDFS, Python, SQL.
- Lakehouse and cloud: Azure Databricks, Delta Lake, medallion architecture, Azure Data
  Factory, ADLS Gen2, Parquet, ORC. His cloud experience is Azure.
- Orchestration and ops: UC4 / Automic, DLS, iDO, Zeta, BDP, Oracle, DistCP.
- Modelling and quality: dimensional modelling, SCD Type 1 & 2, incremental loading, schema
  evolution, ZeroETL replication, data contracts, PII and AES encryption, reconciliation.
- CI/CD and infrastructure: ADLC CI/CD, Git, Jenkins, CVE scanning, shell scripting, Linux,
  multi-cluster Hadoop, PagerDuty.
- Also worked with: PostgreSQL, Tableau.
- Certification: Databricks Fundamentals.
- Education: B.E., National Institute of Engineering (NIE), Mysore, 2017 – 2020.
- Where he adds value fastest: large migrations and backfills that must not lose a row,
  Spark performance tuning, medallion lakehouse design on Azure, and reconciliation and
  governance in domains with sensitive or regulated data.
