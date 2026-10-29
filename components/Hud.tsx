"use client";

import { useEffect, useRef, useState } from "react";
import { useMachine } from "@/lib/machine/store";
import { sendLive, startMetrics } from "@/lib/machine/sim";
import { startFeed, useFeed } from "@/lib/machine/feed";
import { useRender } from "@/lib/gpu";
import type { Metrics } from "@/lib/machine/types";

type Readout = {
  key: keyof Metrics;
  label: string;
  /** Label while the machine runs on the live stream. */
  liveLabel?: string;
  unit: string;
  format: (v: number) => string;
};

const READOUTS: Readout[] = [
  { key: "rowsPerSec", label: "Rows / sec", liveLabel: "Events / sec", unit: "", format: (v) => Math.round(v).toLocaleString("en-US") },
  { key: "latencyMs", label: "Latency p95", liveLabel: "Ingest lag p95", unit: "ms", format: (v) => Math.round(v).toString() },
  { key: "freshnessSec", label: "Gold freshness", liveLabel: "Last event", unit: "s", format: (v) => v.toFixed(1) },
  { key: "dqScore", label: "DQ score", liveLabel: "Contract pass", unit: "%", format: (v) => v.toFixed(2) },
  { key: "costPerHr", label: "Cost / hr", liveLabel: "Cost / hr (sim)", unit: "usd", format: (v) => `$${v.toFixed(2)}` },
];

/** Eases toward the latest value so digits roll rather than jump. */
function Rolling({ value, format }: { value: number; format: (v: number) => string }) {
  const [shown, setShown] = useState(value);
  const cur = useRef(value);
  useEffect(() => {
    let raf = 0;
    const from = cur.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 450);
      cur.current = from + (value - from) * (1 - Math.pow(1 - k, 3));
      setShown(cur.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(shown)}</>;
}

function Spark({ data }: { data: number[] }) {
  if (data.length < 2) return <svg className="h-5 w-full" />;
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

/**
 * Which source the machine is running on, and the switch between them. Live means
 * real Wikipedia edits from Wikimedia's public event stream.
 */
export function FeedSwitch() {
  const { mode, status, total, setMode } = useFeed();
  const live = mode === "live";
  const label =
    !live ? "Simulated sources" : status === "live" ? "Live · Wikipedia edits" : status === "connecting" ? "Connecting to live stream…" : status === "down" ? "Live link down · simulating, retrying" : "Live paused";
  return (
    <div className="flex min-w-0 items-center gap-3 font-mono text-[10px] tracking-[0.2em] uppercase">
      <button
        type="button"
        role="switch"
        aria-checked={live}
        onClick={() => setMode(live ? "sim" : "live")}
        className="group flex min-w-0 items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 transition-colors hover:border-cyan/40"
      >
        <span className={`relative flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${live ? "bg-cyan/20" : "bg-faint/40"}`}>
          <span className={`absolute h-3 w-3 rounded-full transition-all duration-500 ${live ? "left-3.5 bg-cyan shadow-[0_0_8px_#7fd8ff]" : "left-0.5 bg-mute"}`} />
        </span>
        <span className={`truncate ${status === "live" && live ? "text-cyan" : status === "down" && live ? "text-amber" : "text-mute"}`}>{label}</span>
      </button>
      {live && status === "live" && <span className="hidden whitespace-nowrap text-faint tabular-nums md:inline">{total.toLocaleString("en-US")} ingested</span>}
    </div>
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

/** Live telemetry strip. Pure DOM, so it works with or without WebGL. */
export function Hud({ tasks }: { tasks: string[] }) {
  const metrics = useMachine((s) => s.metrics);
  const history = useMachine((s) => s.history);
  const onLive = useFeed((s) => s.mode === "live" && s.status === "live");
  useEffect(() => {
    startMetrics(tasks);
    startFeed(sendLive);
  }, [tasks]);

  return (
    <div
      className="relative grid grid-cols-3 gap-x-4 gap-y-5 font-mono sm:gap-x-6 lg:grid-cols-5 after:pointer-events-none after:absolute after:-inset-3 after:bg-[repeating-linear-gradient(0deg,rgb(127_216_255/0.035)_0px,rgb(127_216_255/0.035)_1px,transparent_1px,transparent_3px)]"
      aria-label={onLive ? "Pipeline telemetry (live Wikipedia edits)" : "Pipeline telemetry (simulated)"}
    >
      {READOUTS.map((r, i) => (
        <div key={r.key} className={`border-t border-line pt-3 ${i === 2 || i === 4 ? "hidden lg:block" : ""}`}>
          <div className="truncate text-[9px] tracking-[0.24em] text-mute uppercase">{onLive && r.liveLabel ? r.liveLabel : r.label}</div>
          <div className="mt-2 flex items-baseline gap-1.5 text-ink tabular-nums">
            <span className="text-base sm:text-lg md:text-xl">{metrics ? <Rolling value={metrics[r.key]} format={r.format} /> : "—"}</span>
            {r.unit && r.unit !== "usd" && <span className="text-[10px] text-mute">{r.unit}</span>}
          </div>
          <div className="mt-2 text-cyan/50">
            <Spark data={history[r.key]} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** One-line orchestrator status: run id, current task, health. */
export function RunLine() {
  const dag = useMachine((s) => s.dag);
  const incident = useMachine((s) => s.incident);
  const phase = useMachine((s) => s.phase);
  const running = dag?.tasks.find((t) => t.state === "running");
  const done = dag?.tasks.filter((t) => t.state === "success").length ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] tracking-[0.2em] text-mute uppercase">
      {incident && phase !== "recovered" ? (
        <span className={incident.severity === "error" ? "text-error" : "text-amber"}>
          ▲ {phase === "heal" ? "Healing" : "Incident"} · {incident.label}
        </span>
      ) : incident ? (
        <span className="text-cyan">✓ Healed</span>
      ) : (
        <span>
          <span className="text-cyan">●</span> Nominal
        </span>
      )}
      <span>dag foundry_daily</span>
      <span className="tabular-nums">run #{dag?.runId ?? "—"}</span>
      <span className="text-ink/80">
        {running ? <>▸ {running.id}</> : dag ? "✓ published" : "…"}
      </span>
      <span className="flex gap-1" aria-hidden>
        {dag?.tasks.map((t) => (
          <span
            key={t.id}
            className={`h-1 w-3 transition-colors duration-700 ${t.state === "running" ? "bg-cyan" : t.state === "success" ? "bg-cyan/35" : "bg-faint/50"}`}
          />
        ))}
      </span>
      <span className="sr-only">{done} of {dag?.tasks.length ?? 0} tasks complete</span>
    </div>
  );
}
