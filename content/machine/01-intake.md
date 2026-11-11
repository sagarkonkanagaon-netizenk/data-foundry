---
id: intake
order: 1
label: "01 · Intake"
title: Intake ports
# Accent colour of this stage in the machine (CSS hex).
color: "#7fd8ff"
summary: "One real source: every edit on every Wikipedia, sampled each hour."
# The four particle streams. Labels are replaced at render time by the four busiest
# wikis in the latest real pipeline run; these are the fallbacks and the colours.
sources:
  - id: wiki-1
    label: Wikimedia
    domain: Wikimedia recent changes
    color: "#7fd8ff"
  - id: wiki-2
    label: Wikimedia
    domain: Wikimedia recent changes
    color: "#9d8cff"
  - id: wiki-3
    label: Wikimedia
    domain: Wikimedia recent changes
    color: "#c7b8ff"
  - id: wiki-4
    label: Wikimedia
    domain: Wikimedia recent changes
    color: "#5fe0d0"
project: case-ebay-orchestration-migration
draft: false
---

The machine runs on one real source: Wikimedia's public recent-changes stream, every
edit and page creation on every Wikipedia and its sister wikis. Each hour the pipeline
in `/pipeline` samples it for two minutes. The four streams here are the four busiest
wikis in the latest run.

The intake's only job is to **accept everything and lose nothing**: the lines are
written untouched to a landing file, so any run can be replayed exactly. Judgement
happens later.
