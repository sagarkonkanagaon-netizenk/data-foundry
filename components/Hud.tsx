"use client";

import { useEffect, useRef, useState } from "react";
import { useMachine } from "@/lib/machine/store";
import { startMetrics } from "@/lib/machine/sim";
import type { Metrics } from "@/lib/machine/types";

type Readout = {
  key: keyof Metrics;
  label: string;
  unit: string;
  format: (v: number) => string;
};

const READOUTS: Readout[] = [
  { key: "rowsPerSec", label: "Rows / sec", unit: "", format: (v) => Math.round(v).toLocaleString("en-US") },
  { key: "latencyMs", label: "Latency p95", unit: "ms", format: (v) => Math.round(v).toString() },
  { key: "freshnessSec", label: "Gold freshness", unit: "s", format: (v) => v.toFixed(1) },
  { key: "dqScore", label: "DQ score", unit: "%", format: (v) => v.toFixed(2) },
  { key: "costPerHr", label: "Cost / hr", unit: "usd", format: (v) => `$${v.toFixed(2)}` },
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

/** Live telemetry strip. Pure DOM, so it works with or without WebGL. */
export function Hud({ tasks }: { tasks: string[] }) {
  const metrics = useMachine((s) => s.metrics);
  const history = useMachine((s) => s.history);
  useEffect(() => startMetrics(tasks), [tasks]);

  return (
    <div
      className="relative grid grid-cols-2 gap-x-6 gap-y-5 font-mono sm:grid-cols-3 lg:grid-cols-5 after:pointer-events-none after:absolute after:-inset-3 after:bg-[repeating-linear-gradient(0deg,rgb(127_216_255/0.035)_0px,rgb(127_216_255/0.035)_1px,transparent_1px,transparent_3px)]"
      aria-label="Pipeline telemetry (simulated)"
    >
      {READOUTS.map((r) => (
        <div key={r.key} className="border-t border-line pt-3">
          <div className="text-[9px] tracking-[0.24em] text-mute uppercase">{r.label}</div>
          <div className="mt-2 flex items-baseline gap-1.5 text-ink tabular-nums">
            <span className="text-lg md:text-xl">{metrics ? <Rolling value={metrics[r.key]} format={r.format} /> : "—"}</span>
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
