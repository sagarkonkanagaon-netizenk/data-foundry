"use client";

import type { RunReport } from "../runs";
import { useMachine } from "./store";
import type { TaskState } from "./types";

// Replays a real run's stages on the machine, in order, each lit for a time in
// proportion to how long it really took (compressed to fit ~14 s), then holds the
// result. A failed stage stays red and the stages after it never light, as in the run.

const LOOP_S = 14;
const HOLD_S = 4;
const MIN_S = 1.1;
const MAX_S = 4.5;

let timer: ReturnType<typeof setInterval> | undefined;

export function replay(report: RunReport | null) {
  clearInterval(timer);
  if (!report || !report.stages.length) {
    useMachine.getState().apply({ runId: report?.run_id ?? "", tasks: [] });
    return;
  }
  const total = report.stages.reduce((a, s) => a + (s.status === "skipped" ? 0 : (s.duration_s ?? 0)), 0) || 1;
  const plan = report.stages.map((s) => ({
    id: s.name,
    final: (s.status === "ok" ? "success" : s.status === "failed" ? "failed" : "queued") as TaskState,
    span: s.status === "skipped" ? 0 : Math.min(MAX_S, Math.max(MIN_S, ((s.duration_s ?? 0) / total) * LOOP_S)),
  }));
  const cycle = plan.reduce((a, p) => a + p.span, 0) + HOLD_S;
  const t0 = performance.now();
  const tick = () => {
    const t = ((performance.now() - t0) / 1000) % cycle;
    let acc = 0;
    let stopped = false;
    const tasks = plan.map((p) => {
      let state: TaskState;
      if (stopped || p.span === 0) state = "queued";
      else if (t < acc) state = "queued";
      else if (t < acc + p.span) state = p.final === "failed" ? "failed" : "running";
      else state = p.final;
      if (p.final === "failed" && t >= acc) stopped = true;
      acc += p.span;
      return { id: p.id, state };
    });
    useMachine.getState().apply({ runId: report.run_id, tasks });
  };
  tick();
  timer = setInterval(tick, 200);
  // how busy the run was: rows landed against the sampler's cap
  const landed = report.rows.landed ?? report.rows.bronze ?? 0;
  useMachine.getState().setThroughput(Math.min(1, 0.25 + landed / 8000));
}
