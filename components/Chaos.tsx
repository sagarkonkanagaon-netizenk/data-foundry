"use client";

import { useEffect, useRef, useState } from "react";
import { useMachine, type Incident } from "@/lib/machine/store";
import { useRuns } from "@/lib/machine/runs";
import { incidentsOf } from "@/lib/machine/incidents";
import { codeUrl, type RunReport } from "@/lib/runs";
import type { Chaos } from "@/lib/content";

export type ChaosItem = Chaos & { html: string };

const href = (path: string) => (path.startsWith("http") ? path : codeUrl(path));

/** Drives the incident clock. */
export function ChaosDirector() {
  useEffect(() => {
    const id = setInterval(() => useMachine.getState().tickIncident(), 100);
    return () => clearInterval(id);
  }, []);
  return null;
}

/** Replays a real run's incident on the machine. */
export function replayIncident(report: RunReport, path: string) {
  const first = incidentsOf(report, path)[0];
  if (!first) return false;
  const m = useMachine.getState();
  if (m.incident) return false;
  m.startIncident(first);
  return true;
}

/** Once per visit: if the latest real run had an incident, replay it after the machine settles. */
export function AutoReplay() {
  const latest = useRuns((s) => s.latest);
  const done = useRef(false);
  useEffect(() => {
    if (!latest || done.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    done.current = true;
    const id = setTimeout(() => replayIncident(latest, `runs/${latest.started_at.slice(0, 10)}/${latest.run_id}.json`), 3500);
    return () => clearTimeout(id);
  }, [latest]);
  return null;
}

/** The failure drills. Each is a simulation, and says so; the card links the real code that handles it. */
export function ChaosPanel({ items }: { items: ChaosItem[] }) {
  const incident = useMachine((s) => s.incident);
  const start = useMachine((s) => s.startIncident);
  return (
    <div className="pointer-events-auto">
      <div className="mb-3 flex items-center gap-3 font-mono text-[9px] tracking-[0.3em] text-mute uppercase">
        <span className={incident ? "text-amber" : "text-ink/80"}>Inject chaos</span>
        <span className="rounded-sm border border-amber/40 px-1.5 py-0.5 text-[8px] tracking-[0.2em] text-amber/90">simulation</span>
        <span className="h-px flex-1 bg-line" />
        <span>{incident ? (incident.real ? "replaying a real run" : "drill running") : "pick a failure"}</span>
      </div>
      {/* one swipeable row on phones, wrapping on wider screens */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {items.map((c) => {
          const active = incident?.id === c.id && !incident.real;
          return (
            <button
              key={c.id}
              type="button"
              disabled={!!incident}
              aria-label={`Simulate ${c.label}`}
              onClick={() => start({ id: c.id, label: c.label, stage: c.stage as Incident["stage"], severity: c.severity, lines: [c.detect, c.diagnose, c.heal] })}
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

/**
 * The incident card. For a replayed real run: what the report says happened, and a link
 * to the run. For a drill: the simulated story, labelled, and the real code path.
 */
export function IncidentCard({ items }: { items: ChaosItem[] }) {
  const incident = useMachine((s) => s.incident);
  const phase = useMachine((s) => s.phase);
  const open = useRuns((s) => s.open);
  const index = useRuns((s) => s.index);
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
  const steps: [string, string, string][] = shown.real
    ? [["detect", "what happened", tone], ["diagnose", "why", "text-ink/80"], ["heal", "what the pipeline did", "text-cyan"]]
    : [["detect", "detect", tone], ["diagnose", "diagnose", "text-ink/80"], ["heal", "handle", "text-cyan"]];
  const lines = shown.lines;
  const run = shown.real && index?.runs.find((r) => r.run_id === shown.real!.runId);

  return (
    <aside
      className="pointer-events-auto w-[min(92vw,380px)] rounded-md border border-line bg-void/75 p-5 font-mono backdrop-blur-xl transition-opacity duration-700"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-[9px] tracking-[0.25em] text-mute uppercase">
        <span>
          {shown.real ? <span className="text-cyan">Real · run {shown.real.runId}</span> : <span className="text-amber">Simulated drill</span>} · <span className={tone}>{shown.label}</span>
        </span>
        <button type="button" onClick={() => setShown(null)} className="text-mute hover:text-ink" aria-label="Close incident report">
          ✕
        </button>
      </div>
      <ol className="mt-4 space-y-2 text-[11px] leading-snug">
        {steps.map(([p, label, cls], i) => (
          <li key={p} className={`transition-all duration-700 ${reached(p) ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${cls}`}>
            <span className="mr-2 text-[9px] tracking-[0.18em] text-mute uppercase opacity-70">{label}</span>
            <br />
            {lines[i]}
          </li>
        ))}
      </ol>
      <div className={`overflow-hidden transition-all duration-1000 ${reached("recovered") ? "mt-4 max-h-[28rem] opacity-100" : "max-h-0 opacity-0"}`}>
        {shown.real ? (
          <div className="border-t border-line pt-4 font-display text-[13px] leading-relaxed text-ink/75">
            <p>{shown.real.summary}</p>
            {run && (
              <button type="button" onClick={() => open(run)} className="mt-3 font-mono text-[10px] tracking-[0.2em] text-cyan uppercase hover:underline">
                Open this run&apos;s report →
              </button>
            )}
          </div>
        ) : (
          <div className="border-t border-line pt-4">
            <div className="font-display text-[13px] leading-relaxed [&_code]:font-mono [&_code]:text-cyan [&_p]:mb-2 [&_p]:text-ink/75" dangerouslySetInnerHTML={{ __html: item?.html ?? "" }} />
            {!!item?.code?.length && (
              <div className="mt-2">
                <div className="text-[9px] tracking-[0.22em] text-mute uppercase">The real code path</div>
                <ul className="mt-1.5 space-y-1 text-[11px]">
                  {item.code.map((c) => (
                    <li key={c.path + c.label}>
                      <a href={href(c.path)} className="text-cyan underline-offset-4 hover:underline">
                        {c.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3 text-[9px] tracking-[0.2em] text-amber/80 uppercase">This drill is a simulation. Real incidents replay from the run history.</div>
          </div>
        )}
      </div>
    </aside>
  );
}
