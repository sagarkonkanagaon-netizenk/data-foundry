"use client";

import { useEffect, useState } from "react";
import { useMachine, type Incident } from "@/lib/machine/store";
import { chaosSignal } from "@/lib/machine/store";
import { sendChaos } from "@/lib/machine/sim";
import { T } from "@/lib/machine/chaos";
import type { Chaos } from "@/lib/content";

export type ChaosItem = Chaos & { html: string };

/** Drives the incident clock: advances phases and keeps the telemetry sim informed. */
export function ChaosDirector() {
  useEffect(() => {
    let wasActive = false;
    const id = setInterval(() => {
      useMachine.getState().tickIncident();
      const signal = chaosSignal();
      if (signal || wasActive) sendChaos(signal);
      wasActive = !!signal;
    }, 100);
    return () => clearInterval(id);
  }, []);
  return null;
}

/** The INJECT CHAOS buttons. One incident at a time. */
export function ChaosPanel({ items }: { items: ChaosItem[] }) {
  const incident = useMachine((s) => s.incident);
  const start = useMachine((s) => s.startIncident);
  return (
    <div className="pointer-events-auto">
      <div className="mb-3 flex items-center gap-3 font-mono text-[9px] tracking-[0.3em] text-mute uppercase">
        <span className={incident ? "text-amber" : "text-ink/80"}>Inject chaos</span>
        <span className="h-px flex-1 bg-line" />
        <span>{incident ? "sentinel engaged" : "pick a failure"}</span>
      </div>
      {/* one swipeable row on phones, wrapping on wider screens */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {items.map((c) => {
          const active = incident?.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              disabled={!!incident}
              onClick={() =>
                start({ id: c.id, label: c.label, stage: c.stage as Incident["stage"], severity: c.severity, lines: [c.detect, c.diagnose, c.heal] })
              }
              className={`group flex shrink-0 items-center gap-2 rounded-sm border px-3 py-2 font-mono text-[10px] tracking-[0.16em] uppercase transition-all duration-500 ${
                active
                  ? c.severity === "error"
                    ? "border-error/70 bg-error/10 text-error"
                    : "border-amber/70 bg-amber/10 text-amber"
                  : "border-line text-ink/75 hover:border-amber/50 hover:bg-amber/5 hover:text-ink disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-transparent"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${c.severity === "error" ? "bg-error" : "bg-amber"} ${active ? "motion-safe:animate-ping" : ""}`} />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const fmt = (s: number) => `T+${s.toFixed(1)}s`;

/** The incident report: what broke, what the Sentinel saw, what it did, and why. */
export function IncidentCard({ items }: { items: ChaosItem[] }) {
  const incident = useMachine((s) => s.incident);
  const phase = useMachine((s) => s.phase);
  const [shown, setShown] = useState<Incident | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (incident) {
      setShown(incident);
      setDone(false);
    } else if (shown) setDone(true);
  }, [incident, shown]);

  if (!shown) return null;
  const item = items.find((c) => c.id === shown.id);
  const order = ["inject", "detect", "diagnose", "heal", "recovered"];
  const reached = (p: string) => done || (phase !== null && order.indexOf(phase) >= order.indexOf(p));
  const tone = shown.severity === "error" ? "text-error" : "text-amber";
  const rows: [string, number, string, string][] = [
    ["detect", T.detect, shown.lines[0], tone],
    ["diagnose", T.diagnose, shown.lines[1], "text-ink/80"],
    ["heal", T.heal, shown.lines[2], "text-cyan"],
  ];

  return (
    <aside
      className="pointer-events-auto w-[min(92vw,380px)] rounded-md border border-line bg-void/75 p-5 font-mono backdrop-blur-xl transition-opacity duration-700"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-[9px] tracking-[0.25em] text-mute uppercase">
        <span>
          INC-{String(4800 + shown.number).padStart(5, "0")} · <span className={tone}>{shown.label}</span>
        </span>
        <button type="button" onClick={() => setShown(null)} className="text-mute hover:text-ink" aria-label="Close incident report">
          ✕
        </button>
      </div>
      <ol className="mt-4 space-y-2 text-[11px] leading-snug">
        <li className="text-mute">
          <span className="mr-2 tabular-nums opacity-60">T+0.0s</span>fault injected → {shown.stage}
        </li>
        {rows.map(([p, at, text, cls]) => (
          <li key={p} className={`transition-all duration-700 ${reached(p) ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${cls}`}>
            <span className="mr-2 tabular-nums text-mute opacity-60">{fmt(at)}</span>
            {text}
          </li>
        ))}
      </ol>
      <div className={`overflow-hidden transition-all duration-1000 ${reached("recovered") ? "mt-4 max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-line pt-4 font-display text-[13px] leading-relaxed [&_code]:font-mono [&_code]:text-cyan [&_p]:mb-2 [&_p]:text-ink/75 [&_strong]:text-ink" dangerouslySetInnerHTML={{ __html: item?.html ?? "" }} />
        <div className="mt-2 text-[10px] tracking-[0.2em] text-cyan uppercase">
          ✓ healed in {(T.recovered - T.detect).toFixed(1)}s · no human paged
        </div>
      </div>
    </aside>
  );
}
