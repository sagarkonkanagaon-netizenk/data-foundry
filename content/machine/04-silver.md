---
id: silver
order: 4
label: "04 · Silver"
title: Silver chamber
color: "#d6e4f0"
summary: "Clear glass. Records align into a conformed lattice; bad ones go to quarantine."
project: phoenix
draft: true
---

Silver is where records become trustworthy. Types are enforced, duplicates removed,
keys conformed across sources, and late or corrected records merged in with `MERGE`
so history stays consistent.

Every record passes a set of **data quality expectations** (not-null keys, valid
ranges, referential checks). Records that fail are not silently dropped. They are
routed to the **quarantine pod** with the reason attached, so they can be fixed and
replayed.

**Built with:** Delta `MERGE`, expectations / Great Expectations-style checks,
SCD Type 2.
