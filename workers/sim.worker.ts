/// <reference lib="webworker" />
// Runs the machine's simulation off the main thread: telemetry ticks at 4Hz, and the
// particle flow is computed into buffers the main thread hands over each frame.

import { createFlow, makeRecords, type FlowRecord } from "../components/machine/flow/sim";
import { live } from "../components/machine/geometry";
import { createMetricsSim } from "../lib/machine/metrics";
import type { FromWorker, ToWorker } from "../lib/machine/types";

declare const self: DedicatedWorkerGlobalScope;

let flow: ReturnType<typeof createFlow> | null = null;
let metrics: ReturnType<typeof createMetricsSim> | null = null;
let records: FlowRecord[] = [];

const post = (msg: FromWorker, transfer: Transferable[] = []) => self.postMessage(msg, transfer);

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  if (msg.type === "init-flow") {
    records = makeRecords(msg.count);
    flow = createFlow(msg.colors);
    return;
  }
  if (msg.type === "metrics") {
    const sim = (metrics = createMetricsSim(msg.tasks));
    const t0 = performance.now();
    let last = t0;
    setInterval(() => {
      const now = performance.now();
      const { metrics, dag } = sim.step((now - last) / 1000, (now - t0) / 1000);
      last = now;
      post({ type: "tick", metrics, dag });
    }, 250);
    return;
  }
  if (msg.type === "live") {
    metrics?.setLive(msg.stats);
    return;
  }
  if (msg.type === "chaos") {
    metrics?.setChaos(msg.signal);
    return;
  }
  if (msg.type === "flow" && flow) {
    Object.assign(live, msg.live);
    flow.step(records, msg.t, msg, msg.chaos);
    post({ type: "flow", position: msg.position, color: msg.color, alpha: msg.alpha, jitter: msg.jitter }, [
      msg.position.buffer,
      msg.color.buffer,
      msg.alpha.buffer,
      msg.jitter.buffer,
    ]);
  }
};
