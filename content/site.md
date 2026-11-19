---
name: Sagar Konkanagaon
shortName: Sagar
title: Senior Data Engineer
location: Bengaluru, India
email: sagarkonkanagaon@gmail.com
years: "5+"
# Shown in browser tabs and search results.
seoTitle: "Sagar · Senior Data Engineer · The Data Foundry"
seoDescription: "Sagar Konkanagaon, Senior Data Engineer at eBay, Bengaluru. Petabyte-scale Spark and Hadoop, Azure Databricks, Delta Lake and ADF across e-commerce, automotive, finance and industrial IoT. See a real medallion pipeline run every hour."
# The one line under the name. Keep it under ~90 characters.
tagline: "I build data pipelines that check their own data and are safe to run twice."
# The highlights on the first screen. Only real, citable results go here.
results:
  - org: eBay
    text: "350+ pipeline migrations, from UC4 (Automic) to DLS"
  - org: eBay
    text: "975B-row data reconciliation across ZeroETL Oracle replication"
  - org: eBay
    text: "12.4B-row AES-encrypted data backfill"
  - org: Tiger Analytics
    text: "35% faster Spark on Databricks"
  - org: eBay
    text: "Petabyte-scale Spark & Hadoop, on tables of ~2 trillion rows"
# The four buttons on the first screen, in order. The first one is the primary button.
actions:
  - label: Résumé (PDF)
    href: /resume.pdf
  - label: GitHub
    href: https://github.com/sagarkonkanagaon-netizenk
  - label: LinkedIn
    href: https://www.linkedin.com/in/sagar-konkanagaon-346914156
  - label: Contact
    href: "#transmit"
# The link to the page without the machine.
plainLabel: "Skip the machine"
# Small caps label above the name.
kicker: "The Data Foundry · est. 2020"
# Shows an "Open to new roles" signal under the name. Set to false once hired.
openToWork: true
links:
  - label: GitHub
    href: https://github.com/sagarkonkanagaon-netizenk
  - label: LinkedIn
    href: https://www.linkedin.com/in/sagar-konkanagaon-346914156
  - label: Résumé (PDF)
    href: /resume.pdf
draft: false
---

Pipeline work is invisible. When it goes right, nobody notices; when it goes wrong,
someone gets paged at 3am. This site makes the invisible part visible.

The machine above runs on a real pipeline. Every hour, GitHub Actions samples the
Wikimedia recent-changes stream and runs it through **Bronze**, **Silver** and **Gold**
Delta tables with PySpark, checks the data against its contracts, and publishes a run
report. The machine replays the latest run: its stages, its row counts, the rows it
quarantined. When a real run had rejects, a schema change or a failed check, the machine
replays that incident.

The run history shows the last 48 runs; open any cell for its full report.
**Inject chaos** is a simulation, labelled as one, and each drill links to the code in
`/pipeline` that handles that failure for real. Click any chamber to see the project
behind it.
