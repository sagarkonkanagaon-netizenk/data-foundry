"use client";

import { useEffect } from "react";
import { useRuns } from "@/lib/machine/runs";
import type { RunIndex, RunReport } from "@/lib/runs";

/** Hands the server-fetched run history and latest report to the client-side machine. */
export function RunsInit({ index, latest }: { index: RunIndex | null; latest: RunReport | null }) {
  useEffect(() => useRuns.getState().init(index, latest), [index, latest]);
  return null;
}
