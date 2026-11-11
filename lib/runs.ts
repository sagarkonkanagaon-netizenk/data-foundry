// Pipeline run reports, as published by /pipeline to the `pipeline-data` branch.
// The shapes mirror pipeline/foundry/report.py. Nothing here is simulated: if the
// reports can't be fetched, callers get null and the site says so.

export const PIPELINE_REPO = "https://github.com/sagarkonkanagaon-netizenk/data-foundry";
export const PIPELINE_DATA_URL = (
  process.env.NEXT_PUBLIC_PIPELINE_DATA_URL || "https://raw.githubusercontent.com/sagarkonkanagaon-netizenk/data-foundry/pipeline-data/reports"
).replace(/\/$/, "");
/** Where the reports can be browsed on GitHub. */
export const PIPELINE_DATA_TREE = `${PIPELINE_REPO}/tree/pipeline-data/reports`;
export const PIPELINE_CODE = `${PIPELINE_REPO}/tree/main/pipeline`;
export const codeUrl = (path: string) => `${PIPELINE_REPO}/blob/main/${path}`;

/** Seconds a fetched report is reused on the server before it is fetched again. */
export const REVALIDATE = 300;

export type RunStatus = "passed" | "warned" | "failed";

export type RunSummary = {
  run_id: string;
  trigger: string;
  status: RunStatus;
  started_at: string;
  duration_s: number | null;
  partitions: string[];
  rows_in: number | null;
  rows_out: number | null;
  rejects: number;
  duplicates: number | null;
  dq_failed: number;
  dq_warned: number;
  schema_changes: number;
  error: string | null;
  path: string;
};

export type RunIndex = { schema_version: number; updated_at: string; keep_days: number; runs: RunSummary[] };

export type StageReport = {
  name: string;
  status: "ok" | "failed" | "skipped" | "pending";
  started_at: string | null;
  duration_s: number | null;
  rows_in: number | null;
  rows_out: number | null;
  detail: Record<string, unknown>;
};

export type DqCheck = {
  check: string;
  target: string;
  status: "pass" | "warn" | "fail" | "skip";
  observed: unknown;
  threshold: unknown;
  severity: "error" | "warn";
  detail: string;
};

export type SchemaChange = { kind: "added" | "type_widened"; field: string; types: string[]; previous: string[]; count: number; example_event_id: string | null };

export type SampleRow = {
  event_id: string;
  event_ts: string | null;
  wiki: string;
  change_type: string;
  namespace: number | null;
  title: string;
  is_bot: boolean;
  length_old: number | null;
  length_new: number | null;
};

export type RejectSample = { reason: string; event_id: string | null; event_hour: string; line: number; raw: string };

export type RunReport = {
  run_id: string;
  trigger: string;
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  duration_s: number | null;
  source: { kind?: string; url?: string; sample_seconds?: number; events?: number; bytes?: number; window_start?: string | null; window_end?: string | null; missing_in_bronze?: string[] };
  partitions: string[];
  stages: StageReport[];
  rows: { landed?: number; bronze?: number; silver?: number; quarantine?: number; duplicates?: number };
  rejects: { total?: number; rate?: number; by_reason?: Record<string, number>; samples?: RejectSample[] };
  samples?: SampleRow[];
  dq: DqCheck[];
  schema_changes: SchemaChange[];
  contract_notes: string[];
  gold: { edits?: number; bot_share?: number | null; top_wikis?: { wiki: string; edits: number }[]; top_pages?: { wiki: string; title: string; edits: number }[]; note?: string };
  lake: Record<string, unknown>;
  error: { stage: string | null; type: string; message: string; contract?: string | null } | null;
  code: { commit?: string; repository?: string; workflow_run?: string };
  schema_version: number;
};

/** A run report's path relative to the reports root, e.g. runs/2026-11-11/20261111T191702Z.json. */
export const RUN_PATH = /^runs\/\d{4}-\d{2}-\d{2}\/\d{8}T\d{6}Z\.json$/;

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${PIPELINE_DATA_URL}/${path}`, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type Runs = { index: RunIndex | null; latest: RunReport | null; fetchedAt: string };

/** The run history and the latest report, or nulls when nothing has been published yet. */
export async function getRuns(): Promise<Runs> {
  const [index, latest] = await Promise.all([get<RunIndex>("index.json"), get<RunReport>("latest.json")]);
  return { index, latest, fetchedAt: new Date().toISOString() };
}

export async function getRun(path: string): Promise<RunReport | null> {
  return RUN_PATH.test(path) ? get<RunReport>(path) : null;
}

/** "an incident worth replaying": rejects, schema changes, a failed or warned check, or a failed run. */
export function hasIncident(r: Pick<RunReport, "status" | "rejects" | "schema_changes" | "dq" | "error">) {
  return r.status !== "passed" || (r.rejects?.total ?? 0) > 0 || r.schema_changes.length > 0;
}
