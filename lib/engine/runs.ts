import { PIPELINE_DATA_TREE, PIPELINE_DATA_URL, type Runs } from "@/lib/runs";
import type { Passage } from "./retrieve";

// The pipeline's own run reports as knowledge for the engine, so "what did the
// pipeline do today?" is answered from the real reports, never from memory.

const pct = (x: number | null | undefined) => (x == null ? "unknown" : `${(x * 100).toFixed(1)}%`);
const when = (id: string) => id.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3 $4:$5 UTC");

export function runPassages({ index, latest }: Runs): Passage[] {
  const out: Passage[] = [];
  if (latest) {
    const path = index?.runs.find((r) => r.run_id === latest.run_id)?.path;
    const dq = latest.dq.filter((c) => c.status !== "skip");
    const lines = [
      `Latest run of the real pipeline (PySpark and Delta Lake on GitHub Actions, sampling Wikimedia's public recent-changes stream): run ${latest.run_id}, started ${when(latest.run_id)}, trigger ${latest.trigger}, status ${latest.status}, took ${latest.duration_s == null ? "unknown" : Math.round(latest.duration_s) + " s"}.`,
      `Source: ${latest.source.events ?? "?"} events sampled over ${latest.source.sample_seconds ?? "?"} s.`,
      `Rows: landed ${latest.rows.landed ?? "?"}, bronze ${latest.rows.bronze ?? "?"}, silver ${latest.rows.silver ?? "?"}, quarantined ${latest.rows.quarantine ?? "?"}, duplicates ${latest.rows.duplicates ?? "?"}. Reject rate ${pct(latest.rejects.rate)}.`,
      latest.rejects.by_reason && Object.keys(latest.rejects.by_reason).length
        ? `Quarantine reasons: ${Object.entries(latest.rejects.by_reason).map(([k, v]) => `${k} ${v}`).join(", ")}.`
        : "No rows were quarantined.",
      `Data quality: ${dq.filter((c) => c.status === "pass").length} of ${dq.length} checks passed (${dq.map((c) => `${c.check} on ${c.target}: ${c.status}`).join("; ")}).`,
      latest.schema_changes.length
        ? `Schema changes found: ${latest.schema_changes.map((c) => `${c.field} ${c.kind}`).join(", ")}.`
        : "No schema changes found.",
      `Gold: ${latest.gold.edits ?? "?"} edits in the sample, bot share ${pct(latest.gold.bot_share)}, busiest wikis ${(latest.gold.top_wikis ?? []).slice(0, 4).map((w) => `${w.wiki} (${w.edits})`).join(", ") || "none"}.`,
      latest.error ? `The run failed in its ${latest.error.stage} stage: ${latest.error.type}: ${latest.error.message}` : "",
    ];
    out.push({
      source: `pipeline run report ${latest.run_id}`,
      text: lines.filter(Boolean).join("\n"),
      label: `Run report ${when(latest.run_id)}`,
      href: path ? `${PIPELINE_DATA_URL}/${path}` : `${PIPELINE_DATA_URL}/latest.json`,
    });
  }
  const runs = index?.runs ?? [];
  if (runs.length) {
    const count = (s: string) => runs.filter((r) => r.status === s).length;
    const recent = runs
      .slice(0, 10)
      .map((r) => `${when(r.run_id)} ${r.status}, ${r.rows_in ?? "?"} rows in, ${r.rejects} rejects${r.error ? `, error: ${r.error}` : ""}`)
      .join("\n");
    out.push({
      source: "pipeline run history",
      text: `Run history of the real pipeline, last ${index?.keep_days ?? 30} days: ${runs.length} runs, ${count("passed")} passed, ${count("warned")} warned, ${count("failed")} failed. Oldest kept run ${when(runs.at(-1)!.run_id)}. Newest first:\n${recent}`,
      label: "Run history",
      href: PIPELINE_DATA_TREE,
    });
  }
  return out;
}
