/// <reference lib="webworker" />
// Runs the particle flow off the main thread: the main thread hands over a set of
// buffers each frame and gets them back filled.

import { createFlow, makeRecords, type FlowRecord } from "../components/machine/flow/sim";
import { live } from "../components/machine/geometry";
import type { FromWorker, ToWorker } from "../lib/machine/types";

declare const self: DedicatedWorkerGlobalScope;

let flow: ReturnType<typeof createFlow> | null = null;
let records: FlowRecord[] = [];

const post = (msg: FromWorker, transfer: Transferable[] = []) => self.postMessage(msg, transfer);

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  if (msg.type === "init-flow") {
    records = makeRecords(msg.count, msg.shape);
    flow = createFlow(msg.colors);
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
