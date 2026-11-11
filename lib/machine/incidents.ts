import type { RunReport } from "../runs";
import type { Incident } from "./store";

// Turns what really happened in a pipeline run into an incident the machine can
// replay. The animation borrows the matching chaos drill's visuals; every word on the
// incident card comes from the run report.

export type RealIncident = Omit<Incident, "startedAt" | "number">;

const pct = (x: number | undefined) => `${((x ?? 0) * 100).toFixed(1)}%`;
const clip = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const STAGE_OF: Record<string, Incident["stage"]> = { extract: "intake", bronze: "bronze", schema: "bronze", silver: "silver", gold: "gold", quality: "silver" };

export function incidentsOf(r: RunReport, path: string): RealIncident[] {
  const out: RealIncident[] = [];
  const real = (summary: string) => ({ runId: r.run_id, path, summary });

  if (r.error) {
    const stage = STAGE_OF[r.error.stage ?? ""] ?? "silver";
    out.push({
      id: stage === "intake" ? "source-outage" : "null-storm",
      label: `Run failed in ${r.error.stage ?? "?"}`,
      stage,
      severity: "error",
      lines: [`${r.error.type} in ${r.error.stage}`, clip(r.error.message, 140), "run stopped · later stages skipped · report still published"],
      real: real(`The run stopped in its ${r.error.stage} stage: ${r.error.message}`),
    });
  }

  for (const c of r.dq.filter((c) => (c.status === "fail" || c.status === "warn") && c.check !== "reject_rate")) {
    out.push({
      id: c.check === "freshness" ? "late-data" : "null-storm",
      label: `DQ ${c.check} ${c.status === "fail" ? "failed" : "warned"}`,
      stage: c.target.startsWith("bronze") ? "bronze" : "silver",
      severity: c.status === "fail" ? "error" : "warning",
      lines: [clip(`${c.check} on ${c.target}: observed ${JSON.stringify(c.observed)}`), clip(`threshold ${c.threshold}`), `run marked ${c.status === "fail" ? "failed" : "warned"} in the history`],
      real: real(`The ${c.check} check on ${c.target} observed ${JSON.stringify(c.observed)} against a threshold of ${c.threshold}.`),
    });
  }

  if (r.schema_changes.length) {
    const c = r.schema_changes[0];
    const what = c.kind === "added" ? `new field ${c.field} (${c.types.join("|")})` : `${c.field} now also ${c.types.filter((t) => !c.previous.includes(t)).join("|")}`;
    const more = r.schema_changes.length > 1 ? ` +${r.schema_changes.length - 1} more` : "";
    out.push({
      id: "schema-drift",
      label: "Schema change",
      stage: "bronze",
      severity: "warning",
      lines: [clip(`${what}${more}`), `in ${c.count} events · recorded in ops/schema_changes`, c.kind === "added" ? "kept in silver.extras · run continued" : "rows that no longer cast → quarantine"],
      real: real(r.schema_changes.map((x) => `${x.kind === "added" ? "added" : "type widened"}: ${x.field} (${x.types.join(", ")}) in ${x.count} events`).join("; ")),
    });
  }

  const total = r.rejects?.total ?? 0;
  if (total > 0) {
    const reasons = Object.entries(r.rejects.by_reason ?? {}).sort((a, b) => b[1] - a[1]);
    out.push({
      id: "null-storm",
      label: "Rows quarantined",
      stage: "silver",
      severity: r.status === "failed" ? "error" : "warning",
      lines: [
        `${total} of ${r.rows.bronze ?? "?"} rows failed the silver contract`,
        clip(reasons.slice(0, 3).map(([k, v]) => `${k} ×${v}`).join(" · ")),
        `routed to silver.quarantine · ${pct(r.rejects.rate)} (limit 25%)`,
      ],
      real: real(`${total} rows were quarantined: ${reasons.map(([k, v]) => `${k} ×${v}`).join(", ")}.`),
    });
  }
  return out;
}
