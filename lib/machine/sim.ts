"use client";

import type { FlowShape, FromWorker, ToWorker } from "./types";

// The particle flow runs in a Web Worker when one is available (Particles computes it
// on the main thread otherwise). Only the animation lives here; every number on the
// page comes from real run reports (lib/machine/runs.ts).

let worker: Worker | null | undefined;
let flowHandler: ((m: FromWorker) => void) | null = null;

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    // Bundled separately by esbuild (npm run worker) so it works the same under any Next bundler.
    worker = new Worker("/sim.worker.js", { type: "module" });
    worker.onmessage = (e: MessageEvent<FromWorker>) => flowHandler?.(e.data);
  } catch {
    worker = null;
  }
  return worker;
}

/** Returns a sender for flow requests, or null if the flow must run on the main thread. */
export function connectFlow(count: number, colors: string[], shape: FlowShape, onFlow: typeof flowHandler) {
  const w = getWorker();
  if (!w) return null;
  flowHandler = onFlow;
  w.postMessage({ type: "init-flow", count, colors, shape } satisfies ToWorker);
  return (msg: Extract<ToWorker, { type: "flow" }>) =>
    w.postMessage(msg, [msg.position.buffer, msg.color.buffer, msg.alpha.buffer, msg.jitter.buffer]);
}
