---
slug: oss-deja
order: 5
kind: open-source
scene: memory
codename: OSS 02
title: "deja: memory for AI coding agents"
status: Open source · v0.4.0
problem: "AI coding agents forget everything when a session ends, so they rediscover the same missing env var, flaky import and broken command every week, and you pay for the same tokens each time."
diagram: [Command fails, Fix recorded, Pinned to file hashes, Recalled at the next failure]
stack: [TypeScript, Node.js, SQLite FTS5, MCP, Claude Code hooks, Codex]
impact:
  value: "0"
  label: "dependencies · extra model calls"
links:
  - label: GitHub
    href: https://github.com/sagarkonkanagaon-netizenk/deja
draft: false
---

**The problem.** Claude Code and Codex start every session from zero. The same
errors get debugged again and again, and generic memory tools store transcripts rather
than the thing you actually need: what fixed it.

**What it does.** deja hooks into the agent's session. When a command fails and later
passes, it records the error and exactly what changed in between. The next time that
error appears, in any session or repo, the fix is shown right next to the failure. It
also learns the test, build and lint commands that really work in a repo, and briefs
the agent at session start.

**Never confidently wrong.** Every memory is pinned to the content hash of the files it
describes. When the code changes, the memory is flagged as possibly stale instead of
steering the agent the wrong way.

**Light to run.** Zero npm dependencies: Node's built-in SQLite with full-text search,
no background worker, no port, no vector database and no LLM calls of its own. It adds
about 1,100 tokens to a typical session. A data pack records tables and lineage from
SQL, PySpark, dbt and Airflow code, and `deja ui` opens an offline HTML browser of
everything it remembers.

**Engineering.** Works in Claude Code and OpenAI Codex with one shared memory, tested on
macOS, Linux and Windows in CI. MIT licensed.
