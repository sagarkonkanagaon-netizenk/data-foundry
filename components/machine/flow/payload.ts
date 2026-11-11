import type { FlowRecord, Leg } from "./sim";
import type { RejectSample, RunReport, SampleRow } from "../../../lib/runs";

// What a particle's hover card shows: a real row from the latest pipeline run.
// Good particles carry one of the run's silver sample rows, red ones one of its
// quarantined rows with the reason it was rejected.

const LAYER: Record<Leg, string> = {
  intake: "landing",
  bronze: "bronze.recentchange",
  toSpark: "bronze.recentchange",
  spark: "spark",
  toSilver: "spark",
  silver: "silver.recentchange",
  toGold: "silver.recentchange",
  gold: "gold",
};

export type Payload = { head: string; body: string; bad: boolean } | null;

export function payloadFor(report: RunReport | null, r: FlowRecord, leg: Leg): Payload {
  if (!report) return null;
  const rejects = report.rejects?.samples ?? [];
  const rows = report.samples ?? [];
  if (r.bad && rejects.length) {
    const x: RejectSample = rejects[r.id % rejects.length];
    const late = leg === "silver" || leg === "toGold" || leg === "gold";
    const body: Record<string, unknown> = { _layer: late ? "silver.quarantine" : LAYER[leg], reason: late ? x.reason : undefined, event_id: x.event_id, raw: x.raw.length > 120 ? `${x.raw.slice(0, 120)}…` : x.raw };
    return { head: `run ${report.run_id} · rejected`, body: JSON.stringify(body, null, 2), bad: true };
  }
  if (!rows.length) return null;
  const x: SampleRow = rows[r.id % rows.length];
  const delta = x.length_new != null ? x.length_new - (x.length_old ?? 0) : null;
  const body = { wiki: x.wiki, change_type: x.change_type, title: x.title, is_bot: x.is_bot, bytes_delta: delta, event_ts: x.event_ts, _layer: LAYER[leg] };
  return { head: `run ${report.run_id} · ${x.wiki}`, body: JSON.stringify(body, null, 2), bad: false };
}
