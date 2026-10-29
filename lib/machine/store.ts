import { create } from "zustand";
import type { DagState, Metrics, StageId } from "./types";
import { TASK_STAGE } from "./types";

const HISTORY = 60; // samples kept per metric for HUD sparklines (~15s at 4Hz)

type MachineState = {
  metrics: Metrics | null;
  history: Record<keyof Metrics, number[]>;
  dag: DagState | null;
  /** Stages whose DAG task is running right now. */
  activeStages: Set<StageId>;
  apply: (m: Metrics, dag: DagState) => void;
};

const empty = () => ({ rowsPerSec: [], latencyMs: [], freshnessSec: [], dqScore: [], costPerHr: [], throughput: [], rowsToday: [], quarantined: [] }) as Record<keyof Metrics, number[]>;

export const useMachine = create<MachineState>((set, get) => ({
  metrics: null,
  history: empty(),
  dag: null,
  activeStages: new Set(),
  apply: (metrics, dag) => {
    const history = { ...get().history };
    for (const k of Object.keys(metrics) as (keyof Metrics)[]) {
      const h = history[k].length >= HISTORY ? history[k].slice(1) : history[k].slice();
      h.push(metrics[k]);
      history[k] = h;
    }
    const activeStages = new Set<StageId>();
    for (const t of dag.tasks) if (t.state === "running" && TASK_STAGE[t.id]) activeStages.add(TASK_STAGE[t.id]);
    set({ metrics, dag, history, activeStages });
  },
}));
