// Checks for Ask the Engine that need no API key: what it retrieves, what it is never
// shown, how run reports become sources, and how citations are read.
// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { retrieve } from "@/lib/engine/retrieve";
import { runPassages } from "@/lib/engine/runs";
import { cited, segments } from "@/lib/engine/cite";
import type { RunIndex, RunReport } from "@/lib/runs";

const labels = (q: string) => retrieve(q).map((p) => p.label);

test("questions about a result retrieve its case study", () => {
  assert.ok(labels("What did Sagar do at eBay with UC4?").some((l) => /300\+ pipelines/.test(l)));
  assert.ok(labels("schema evolution IoT devices Trane").some((l) => /Schema evolution for 10,000\+/.test(l)));
  assert.ok(labels("XL Dynamics reconciliation records").some((l) => /20M\+ records/.test(l)));
  assert.ok(labels("Tiger Analytics Spark runtime Databricks").some((l) => /medallion lakehouse/.test(l)));
});

test("every source has a label and a link", () => {
  for (const p of retrieve("pipeline spark delta schema quarantine eBay contact")) {
    assert.ok(p.label.length > 0, p.source);
    assert.match(p.href, /^(\/|https:\/\/)/, p.source);
  }
});

test("open questions and editor notes never reach the engine", () => {
  const all = retrieve("TODO-SAGAR what would you do differently stack context problem", 200);
  for (const p of all) {
    assert.ok(!p.text.includes("TODO-SAGAR"), p.source);
    assert.ok(!p.text.includes("<!--"), p.source);
  }
});

test("run reports become two cited sources with exact numbers", () => {
  const latest = {
    run_id: "20261111T192621Z",
    trigger: "manual",
    status: "passed",
    duration_s: 155.6,
    source: { events: 4405, sample_seconds: 120 },
    rows: { landed: 4405, bronze: 4405, silver: 4405, quarantine: 0, duplicates: 0 },
    rejects: { rate: 0, by_reason: {} },
    dq: [{ check: "row_count", target: "bronze", status: "pass" }],
    schema_changes: [],
    gold: { edits: 2900, bot_share: 0.5, top_wikis: [{ wiki: "enwiki", edits: 900 }] },
    error: null,
  } as unknown as RunReport;
  const index = {
    keep_days: 30,
    runs: [{ run_id: latest.run_id, status: "passed", rows_in: 4405, rejects: 0, error: null, path: "runs/2026-11-11/20261111T192621Z.json" }],
  } as unknown as RunIndex;
  const [run, history] = runPassages({ index, latest, fetchedAt: "" });
  assert.match(run.text, /landed 4405/);
  assert.match(run.text, /2026-11-11 19:26 UTC/);
  assert.match(run.href, /runs\/2026-11-11\/20261111T192621Z\.json$/);
  assert.match(history.text, /1 runs, 1 passed, 0 warned, 0 failed/);
  assert.deepEqual(runPassages({ index: null, latest: null, fetchedAt: "" }), []);
});

test("citations are read, and numbers that don't exist are ignored", () => {
  assert.deepEqual(cited("He moved 300+ pipelines [2]. Also [2, 5] and [9].", 5), [2, 5]);
  assert.deepEqual(segments("A [1] B", 1), [{ text: "A " }, { cite: 1 }, { text: " B" }]);
  assert.deepEqual(cited("No sources here.", 5), []);
});
