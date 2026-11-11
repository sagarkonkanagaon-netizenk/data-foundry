"use client";

import { useEffect, useRef } from "react";
import { runPath, runTime, useRuns } from "@/lib/machine/runs";
import { replay } from "@/lib/machine/replay";
import { incidentsOf } from "@/lib/machine/incidents";
import { replayIncident } from "@/components/Chaos";
import { PIPELINE_CODE, PIPELINE_DATA_TREE, PIPELINE_DATA_URL, type RunIndex } from "@/lib/runs";

const CELLS = 48;
const TONE = {
  passed: "bg-cyan/55 hover:bg-cyan",
  warned: "bg-amber/70 hover:bg-amber",
  failed: "bg-error/75 hover:bg-error",
} as const;
const TEXT = { passed: "text-cyan", warned: "text-amber", failed: "text-error" } as const;

const n = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("en-US"));

/** The last 48 real runs as pass / warn / fail cells, newest on the right. Each opens its report. */
export function RunHistory({ index }: { index: RunIndex | null }) {
  const open = useRuns((s) => s.open);
  const loading = useRuns((s) => s.loading);
  const selected = useRuns((s) => s.selected);
  const runs = (index?.runs ?? []).slice(0, CELLS).reverse();
  const counts = runs.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="pointer-events-auto font-mono">
      <div className="mb-2 flex items-center gap-3 text-[9px] tracking-[0.3em] text-mute uppercase">
        <span className="text-ink/80">Run history</span>
        <span className="h-px flex-1 bg-line" />
        <span>
          {runs.length ? (
            <>
              last {runs.length} · <span className="text-cyan">{counts.passed ?? 0} passed</span>
              {counts.warned ? <span className="text-amber"> · {counts.warned} warned</span> : null}
              {counts.failed ? <span className="text-error"> · {counts.failed} failed</span> : null}
            </>
          ) : (
            "no runs yet"
          )}
        </span>
      </div>
      <ol className="flex h-5 items-stretch gap-[3px]" aria-label="Pipeline runs, oldest first">
        {Array.from({ length: CELLS - runs.length }, (_, i) => (
          <li key={`empty-${i}`} className="flex-1 rounded-[1px] bg-faint/25" aria-hidden />
        ))}
        {runs.map((r) => (
          <li key={r.run_id} className="flex flex-1">
            <button
              type="button"
              onClick={() => open(r)}
              title={`${runTime(r.run_id)} · ${r.status}${r.rejects ? ` · ${r.rejects} quarantined` : ""}${r.schema_changes ? ` · ${r.schema_changes} schema change` : ""}`}
              aria-label={`Run ${runTime(r.run_id)}, ${r.status}. Open its report.`}
              className={`flex-1 rounded-[1px] transition-colors ${TONE[r.status]} ${selected?.run_id === r.run_id ? "ring-1 ring-ink" : ""} ${loading === r.run_id ? "animate-pulse" : ""}`}
            />
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between text-[9px] tracking-[0.2em] text-mute uppercase">
        <a href={PIPELINE_CODE} className="hover:text-ink">pipeline code ↗</a>
        <a href={PIPELINE_DATA_TREE} className="hover:text-ink">all reports ↗</a>
      </div>
      <RunDetail />
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: React.ReactNode; tone?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/60 py-1.5">
      <dt className="text-mute">{k}</dt>
      <dd className={`text-right tabular-nums ${tone ?? "text-ink/90"}`}>{v}</dd>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-2 text-[9px] tracking-[0.28em] text-mute uppercase">{children}</h3>;
}

/** One run's full report, as published. Opens from a history cell or an incident card. */
function RunDetail() {
  const r = useRuns((s) => s.selected);
  const error = useRuns((s) => s.error);
  const close = useRuns((s) => s.close);
  const latest = useRuns((s) => s.latest);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!r) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [r, close]);

  if (error) {
    return (
      <p role="alert" className="mt-2 text-[10px] text-error">
        {error}
      </p>
    );
  }
  if (!r) return null;
  const path = runPath(r);
  const incidents = incidentsOf(r, path);
  const onReplay = () => {
    close();
    replay(r);
    replayIncident(r, path);
    // back to the latest run once this replay has played
    setTimeout(() => replay(latest), 20_000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-void/60 backdrop-blur-sm" onClick={close}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-title"
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-[520px] overflow-y-auto border-l border-line bg-void/95 px-6 py-6 font-mono text-[11px] text-ink/85 sm:px-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[9px] tracking-[0.28em] text-mute uppercase">Pipeline run · {r.trigger}</div>
            <h2 id="run-title" className="mt-2 font-display text-xl font-light text-ink">
              {runTime(r.run_id)}
            </h2>
            <div className={`mt-1 text-[10px] tracking-[0.2em] uppercase ${TEXT[r.status]}`}>
              ● {r.status} · {r.duration_s?.toFixed(0) ?? "—"} s
            </div>
          </div>
          <button ref={closeBtn} type="button" onClick={close} className="text-mute hover:text-ink" aria-label="Close run report">
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] tracking-[0.15em] uppercase">
          {r.code.workflow_run && <a className="text-cyan hover:underline" href={r.code.workflow_run}>CI log ↗</a>}
          <a className="text-cyan hover:underline" href={`${PIPELINE_DATA_URL}/${path}`}>Report JSON ↗</a>
          {r.code.commit && r.code.repository && (
            <a className="text-cyan hover:underline" href={`${r.code.repository}/tree/${r.code.commit}/pipeline`}>
              Code at {r.code.commit.slice(0, 7)} ↗
            </a>
          )}
        </div>

        {incidents.length > 0 && (
          <button type="button" onClick={onReplay} className="mt-5 w-full rounded-sm border border-amber/50 px-3 py-2 text-[10px] tracking-[0.2em] text-amber uppercase hover:bg-amber/10">
            Replay this run on the machine · {incidents[0].label}
          </button>
        )}

        {r.error && (
          <>
            <H>Error</H>
            <p className="rounded-sm border border-error/40 bg-error/5 p-3 text-error">
              {r.error.type} in {r.error.stage}: {r.error.message}
            </p>
          </>
        )}

        <H>Source</H>
        <dl>
          <Row k="events sampled" v={n(r.source.events)} />
          {r.source.sample_seconds != null && <Row k="sample length" v={`${r.source.sample_seconds} s`} />}
          {r.source.window_start && <Row k="event window" v={`${r.source.window_start.slice(11, 19)} – ${r.source.window_end?.slice(11, 19)} UTC`} />}
          <Row k="partitions" v={r.partitions.join(", ") || "—"} />
        </dl>

        <H>Stages</H>
        <table className="w-full text-left tabular-nums">
          <thead className="text-[9px] tracking-[0.2em] text-mute uppercase">
            <tr>
              <th className="py-1 font-normal">stage</th>
              <th className="font-normal">status</th>
              <th className="text-right font-normal">time</th>
              <th className="text-right font-normal">rows in → out</th>
            </tr>
          </thead>
          <tbody>
            {r.stages.map((s) => (
              <tr key={s.name} className="border-t border-line/60">
                <td className="py-1.5">{s.name}</td>
                <td className={s.status === "ok" ? "text-cyan" : s.status === "failed" ? "text-error" : "text-mute"}>{s.status}</td>
                <td className="text-right">{s.duration_s == null ? "—" : `${s.duration_s.toFixed(1)} s`}</td>
                <td className="text-right">
                  {n(s.rows_in)} → {n(s.rows_out)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <H>Rows</H>
        <dl>
          <Row k="landed in bronze" v={n(r.rows.landed)} />
          <Row k="bronze (partitions touched)" v={n(r.rows.bronze)} />
          <Row k="silver" v={n(r.rows.silver)} />
          <Row k="quarantined" v={`${n(r.rows.quarantine)}${r.rejects.rate != null ? ` · ${(r.rejects.rate * 100).toFixed(2)}%` : ""}`} tone={(r.rows.quarantine ?? 0) > 0 ? "text-amber" : undefined} />
          <Row k="duplicates dropped" v={n(r.rows.duplicates)} />
        </dl>

        {Object.keys(r.rejects.by_reason ?? {}).length > 0 && (
          <>
            <H>Quarantine reasons</H>
            <dl>
              {Object.entries(r.rejects.by_reason ?? {}).map(([k, v]) => (
                <Row key={k} k={k} v={n(v)} tone="text-amber" />
              ))}
            </dl>
          </>
        )}

        <H>Data quality</H>
        <table className="w-full text-left">
          <tbody>
            {r.dq.map((c, i) => (
              <tr key={i} className="border-t border-line/60 align-top">
                <td className={`py-1.5 pr-2 ${c.status === "pass" ? "text-cyan" : c.status === "fail" ? "text-error" : c.status === "warn" ? "text-amber" : "text-mute"}`}>{c.status}</td>
                <td className="pr-2">
                  {c.check}
                  <div className="text-[10px] text-mute">{c.target}</div>
                </td>
                <td className="text-right text-[10px] break-all text-ink/70">
                  {typeof c.observed === "object" && c.observed !== null ? Object.entries(c.observed as Record<string, unknown>).map(([k, v]) => `${k} ${v}`).join(" · ") : String(c.observed ?? "—")}
                  <div className="text-mute">{String(c.threshold)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {r.schema_changes.length > 0 && (
          <>
            <H>Schema changes</H>
            <ul className="space-y-1.5">
              {r.schema_changes.map((c) => (
                <li key={c.kind + c.field} className="text-amber">
                  {c.kind === "added" ? "added" : "type widened"} · {c.field} <span className="text-mute">({c.types.join(", ")}) in {c.count} events</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {r.gold.edits != null && (
          <>
            <H>Gold (sampled window)</H>
            <dl>
              <Row k="edits" v={n(r.gold.edits)} />
              {r.gold.bot_share != null && <Row k="bot share" v={`${(r.gold.bot_share * 100).toFixed(1)}%`} />}
              {(r.gold.top_wikis ?? []).slice(0, 3).map((w) => (
                <Row key={w.wiki} k={w.wiki} v={`${n(w.edits)} edits`} />
              ))}
            </dl>
          </>
        )}
        <p className="mt-6 text-[10px] leading-relaxed text-mute">Every number above is read from this run&apos;s report, published by the pipeline in /pipeline.</p>
      </section>
    </div>
  );
}
