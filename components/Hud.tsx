"use client";

import { useEffect, useState } from "react";
import { useMachine } from "@/lib/machine/store";
import { ago, runTime, useRuns } from "@/lib/machine/runs";
import { replay } from "@/lib/machine/replay";
import { useRender } from "@/lib/gpu";
import { PIPELINE_DATA_TREE, type RunReport, type RunSummary } from "@/lib/runs";

const fmt = (n: number | null | undefined) => (n == null ? "—" : Math.round(n).toLocaleString("en-US"));

type Readout = {
  label: string;
  value: (r: RunReport) => string;
  unit?: string;
  /** The same measure across past runs, for the sparkline. */
  series?: (s: RunSummary) => number | null;
};

// Every number here is read from the latest run report published by /pipeline.
const READOUTS: Readout[] = [
  { label: "Rows landed", value: (r) => fmt(r.rows.landed ?? r.rows.bronze), series: (s) => s.rows_in },
  { label: "Rows to silver", value: (r) => fmt(r.rows.silver), series: (s) => s.rows_out },
  {
    label: "Quarantined",
    value: (r) => fmt(r.rejects.total ?? 0),
    unit: "rows",
    series: (s) => s.rejects,
  },
  {
    label: "DQ checks",
    value: (r) => {
      const ran = r.dq.filter((c) => c.status !== "skip");
      return `${ran.filter((c) => c.status === "pass").length}/${ran.length}`;
    },
    unit: "passed",
  },
  { label: "Run time", value: (r) => (r.duration_s == null ? "—" : `${Math.round(r.duration_s)}`), unit: "s", series: (s) => s.duration_s },
];

function Spark({ data }: { data: number[] }) {
  if (data.length < 2) return <svg className="h-5 w-full" aria-hidden />;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const span = hi - lo || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${18 - ((v - lo) / span) * 16}`).join(" ");
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-5 w-full" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** On phones: the 2.5D machine by default, with the full 3D one a tap away. */
export function RenderSwitch() {
  const { ready, canUpgrade, optedIn, upgrade, downgrade } = useRender();
  if (!ready || (!canUpgrade && !optedIn)) return null;
  return (
    <button
      type="button"
      onClick={canUpgrade ? upgrade : downgrade}
      className="shrink-0 rounded-full border border-line px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-mute uppercase transition-colors hover:border-cyan/40 hover:text-ink"
      aria-label={canUpgrade ? "Load the full 3D machine" : "Switch back to the 2.5D machine"}
    >
      {canUpgrade ? "Load 3D" : "Use 2.5D"}
    </button>
  );
}

/** Starts the machine replaying the latest real run (once per page). */
export function ReplayLatest() {
  const latest = useRuns((s) => s.latest);
  useEffect(() => replay(latest), [latest]);
  return null;
}

/** The latest run's numbers, with each one's trend over the run history. Plain DOM, so it works without WebGL. */
export function Hud({ latest, runs }: { latest: RunReport | null; runs: RunSummary[] }) {
  if (!latest) {
    return (
      <p className="border-t border-line pt-3 font-mono text-[10px] leading-relaxed tracking-[0.18em] text-mute uppercase">
        No pipeline run published yet · the machine is idle until the first hourly run lands
      </p>
    );
  }
  const history = runs.slice(0, 48).reverse();
  return (
    <div className="relative grid grid-cols-3 gap-x-4 gap-y-5 font-mono sm:gap-x-6 lg:grid-cols-5" aria-label={`Latest pipeline run, ${runTime(latest.run_id)}`}>
      {READOUTS.map((r, i) => (
        <div key={r.label} className={`border-t border-line pt-3 ${i >= 3 ? "hidden lg:block" : ""}`}>
          <div className="truncate text-[9px] tracking-[0.24em] text-mute uppercase">{r.label}</div>
          <div className="mt-2 flex items-baseline gap-1.5 text-ink tabular-nums">
            <span className="text-base sm:text-lg md:text-xl">{r.value(latest)}</span>
            {r.unit && <span className="text-[10px] text-mute">{r.unit}</span>}
          </div>
          <div className="mt-2 text-cyan/50" title={r.series ? `last ${history.length} runs` : undefined}>
            <Spark data={r.series ? history.map(r.series).filter((v): v is number => v != null) : []} />
          </div>
        </div>
      ))}
    </div>
  );
}

const STATUS_TONE = { passed: "text-cyan", warned: "text-amber", failed: "text-error" } as const;

/** One line on the run the machine is replaying: when, how it ended, and the stage it is on. */
export function RunLine({ latest }: { latest: RunReport | null }) {
  const dag = useMachine((s) => s.dag);
  const incident = useMachine((s) => s.incident);
  const phase = useMachine((s) => s.phase);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!latest) {
    return (
      <div className="font-mono text-[10px] tracking-[0.2em] text-mute uppercase">
        <a href={PIPELINE_DATA_TREE} className="hover:text-ink">○ waiting for the first pipeline run</a>
      </div>
    );
  }
  const running = dag?.tasks.find((t) => t.state === "running" || t.state === "failed");
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] tracking-[0.2em] text-mute uppercase">
      {incident && phase !== "recovered" ? (
        <span className={incident.severity === "error" ? "text-error" : "text-amber"}>
          ▲ {incident.real ? "Replaying" : "Simulating"} · {incident.label}
        </span>
      ) : (
        <span className={STATUS_TONE[latest.status]}>● Last run {latest.status}</span>
      )}
      <span className="tabular-nums" suppressHydrationWarning>
        {runTime(latest.run_id)} · {ago(latest.started_at)}
      </span>
      <span className="text-ink/80">{running ? <>▸ {running.id}</> : "✓ replayed"}</span>
      <span className="flex gap-1" aria-hidden>
        {dag?.tasks.map((t) => (
          <span
            key={t.id}
            className={`h-1 w-3 transition-colors duration-700 ${t.state === "running" ? "bg-cyan" : t.state === "failed" ? "bg-error" : t.state === "success" ? "bg-cyan/35" : "bg-faint/50"}`}
          />
        ))}
      </span>
      {latest.code.workflow_run && (
        <a href={latest.code.workflow_run} className="hidden underline-offset-4 hover:text-ink hover:underline md:inline">
          CI log ↗
        </a>
      )}
    </div>
  );
}
