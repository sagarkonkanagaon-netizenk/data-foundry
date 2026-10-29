import type { DagState, Metrics, TaskState } from "./types";
import type { ChaosSignal } from "./chaos";

// Simulated telemetry. Each signal is a mean-reverting random walk around a baseline
// that slowly breathes, so numbers move like a real pipeline: never still, never wild.

const DURATIONS: Record<string, number> = {
  extract: 2.4,
  land_bronze: 2.0,
  spark_transform: 4.6,
  dq_checks: 1.8,
  merge_silver: 2.2,
  build_gold: 2.6,
  publish: 1.2,
};
const IDLE_BETWEEN_RUNS = 3;

export function createMetricsSim(tasks: string[], seed = 231) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());

  let rows = 52000;
  let latency = 240;
  let dq = 99.6;
  let freshness = 6;
  let rowsToday = 1_284_000_000 + Math.floor(rnd() * 1e8);
  let quarantined = 31_000 + Math.floor(rnd() * 4000);
  let runId = 4812;
  let runT = 0;

  let chaos: ChaosSignal | null = null;
  let lateBacklog = 0;

  const total = tasks.reduce((acc, t) => acc + (DURATIONS[t] ?? 2), 0) + IDLE_BETWEEN_RUNS;

  function step(dt: number, t: number): { metrics: Metrics; dag: DagState } {
    // what each injected fault does to the numbers, scaled by how broken things are
    const f = chaos?.fault ?? 0;
    const id = chaos?.id;
    const rowsHit = id === "skewed-partition" ? 0.5 : id === "schema-drift" ? 0.35 : id === "source-outage" ? 0.3 : id === "late-data" ? 0.2 : 0;
    const latencyHit = id === "skewed-partition" ? 1400 : id === "schema-drift" ? 120 : id === "late-data" ? 60 : 0;
    const dqHit = id === "null-storm" ? 3.6 : id === "schema-drift" ? 0.5 : 0;
    const costHit = id === "skewed-partition" ? 9 : id === "null-storm" ? 1.5 : 0;
    if ((id === "late-data" || id === "source-outage") && f > 0.3) lateBacklog += dt * 18;
    else lateBacklog *= Math.exp(-dt * 1.2);

    const base = (52000 + 9000 * Math.sin(t * 0.05) + 4000 * Math.sin(t * 0.013)) * (1 - rowsHit * f);
    rows += (base - rows) * 0.08 * dt * 4 + gauss() * 1400 * Math.sqrt(dt);
    rows = Math.max(8000, rows);
    const throughput = Math.min(1, rows / 70000);
    latency += (180 + 160 * throughput + latencyHit * f - latency) * 0.25 * dt * 4 + gauss() * 9 * Math.sqrt(dt);
    dq += (99.62 - dqHit * f - dq) * 0.2 * dt * 4 + gauss() * 0.03 * Math.sqrt(dt);
    dq = Math.min(99.99, dq);
    rowsToday += rows * dt;
    quarantined += rows * dt * (100 - dq) * 0.0001 * 0.6 * (1 + (id === "null-storm" ? 30 * f : 0));

    // DAG run cycle
    runT += dt;
    if (runT >= total) {
      runT = 0;
      runId++;
    }
    let acc = 0;
    const states = tasks.map((id) => {
      const d = DURATIONS[id] ?? 2;
      const st: TaskState = runT < acc ? "queued" : runT < acc + d ? "running" : "success";
      acc += d;
      return { id, state: st };
    });
    // Gold is refreshed when "publish" completes
    const publishEnd = acc;
    freshness = runT >= publishEnd ? runT - publishEnd + 1.2 : freshness + dt;

    const metrics: Metrics = {
      rowsPerSec: rows,
      latencyMs: latency,
      freshnessSec: freshness + lateBacklog,
      dqScore: dq,
      costPerHr: 11.4 + throughput * 7.2 + costHit * f + gauss() * 0.04,
      throughput,
      rowsToday,
      quarantined,
    };
    return { metrics, dag: { runId, tasks: states } };
  }

  return { step, setChaos: (c: ChaosSignal | null) => (chaos = c) };
}
