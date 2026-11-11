"use client";

import { create } from "zustand";
import type { RunIndex, RunReport, RunSummary } from "../runs";

// The real pipeline runs, on the client: the history from the server render, the
// latest report, and whichever run the visitor opened from the history strip.

type RunsState = {
  index: RunIndex | null;
  latest: RunReport | null;
  /** The run the visitor opened, and whether it is still loading. */
  selected: RunReport | null;
  loading: string | null;
  error: string | null;
  init: (index: RunIndex | null, latest: RunReport | null) => void;
  open: (run: RunSummary) => Promise<void>;
  close: () => void;
};

const cache = new Map<string, RunReport>();

export const useRuns = create<RunsState>((set, get) => ({
  index: null,
  latest: null,
  selected: null,
  loading: null,
  error: null,
  init: (index, latest) => {
    if (latest) cache.set(`runs/${latest.started_at.slice(0, 10)}/${latest.run_id}.json`, latest);
    set({ index, latest });
  },
  open: async (run) => {
    const hit = cache.get(run.path);
    if (hit) return set({ selected: hit, loading: null, error: null });
    set({ loading: run.run_id, error: null });
    try {
      const res = await fetch(`/api/runs?path=${encodeURIComponent(run.path)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const report = (await res.json()) as RunReport;
      cache.set(run.path, report);
      if (get().loading === run.run_id) set({ selected: report, loading: null });
    } catch (e) {
      set({ loading: null, error: `Couldn't load run ${run.run_id} (${(e as Error).message}).` });
    }
  },
  close: () => set({ selected: null, error: null }),
}));

export const runPath = (r: Pick<RunReport, "run_id" | "started_at">) => `runs/${r.started_at.slice(0, 10)}/${r.run_id}.json`;

/** "4 min ago", "3 h ago", "2 d ago". */
export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 90) return `${Math.round(s)} s ago`;
  if (s < 90 * 60) return `${Math.round(s / 60)} min ago`;
  if (s < 36 * 3600) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

/** Run ids are UTC timestamps, 20261111T191702Z; show them as 2026-11-11 19:17 UTC. */
export function runTime(runId: string) {
  const m = runId.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]} UTC` : runId;
}
