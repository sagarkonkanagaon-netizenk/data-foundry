"use client";

import { createMetricsSim } from "./metrics";
import { useMachine } from "./store";
import type { FromWorker, ToWorker } from "./types";
import type { ChaosSignal } from "./chaos";

// One simulation per page. Prefers a Web Worker; if workers are unavailable the
// telemetry runs on the main thread instead (and Particles computes its own flow).

let worker: Worker | null | undefined;
let flowHandler: ((m: Extract<FromWorker, { type: "flow" }>) => void) | null = null;
let started = false;

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    // Bundled separately by esbuild (npm run worker) so it works the same under any Next bundler.
    worker = new Worker("/sim.worker.js", { type: "module" });
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const m = e.data;
      if (m.type === "tick") useMachine.getState().apply(m.metrics, m.dag);
      else if (m.type === "flow") flowHandler?.(m);
    };
  } catch {
    worker = null;
  }
  return worker;
}

let mainThreadSim: ReturnType<typeof createMetricsSim> | null = null;

/** Tell the telemetry sim how broken the machine is (the flow gets it per frame). */
export function sendChaos(signal: ChaosSignal | null) {
  const w = getWorker();
  if (w) w.postMessage({ type: "chaos", signal } satisfies ToWorker);
  else mainThreadSim?.setChaos(signal);
}

export function startMetrics(tasks: string[]) {
  if (started) return;
  started = true;
  const w = getWorker();
  if (w) {
    w.postMessage({ type: "metrics", tasks } satisfies ToWorker);
    return;
  }
  const sim = (mainThreadSim = createMetricsSim(tasks));
  const t0 = performance.now();
  let last = t0;
  setInterval(() => {
    const now = performance.now();
    const { metrics, dag } = sim.step((now - last) / 1000, (now - t0) / 1000);
    last = now;
    useMachine.getState().apply(metrics, dag);
  }, 250);
}

/** Returns a sender for flow requests, or null if the flow must run on the main thread. */
export function connectFlow(count: number, colors: string[], onFlow: typeof flowHandler) {
  const w = getWorker();
  if (!w) return null;
  flowHandler = onFlow;
  w.postMessage({ type: "init-flow", count, colors } satisfies ToWorker);
  return (msg: Extract<ToWorker, { type: "flow" }>) =>
    w.postMessage(msg, [msg.position.buffer, msg.color.buffer, msg.alpha.buffer, msg.jitter.buffer]);
}
