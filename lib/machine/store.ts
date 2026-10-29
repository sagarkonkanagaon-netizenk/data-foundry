import { create } from "zustand";
import type { DagState, Metrics, StageId } from "./types";
import { faultAt, phaseAt, repairAt, type ChaosSignal, type IncidentPhase } from "./chaos";
import { TASK_STAGE } from "./types";

const HISTORY = 60; // samples kept per metric for HUD sparklines (~15s at 4Hz)

type MachineState = {
  metrics: Metrics | null;
  history: Record<keyof Metrics, number[]>;
  dag: DagState | null;
  /** Stages whose DAG task is running right now. */
  activeStages: Set<StageId>;
  apply: (m: Metrics, dag: DagState) => void;
  incident: Incident | null;
  phase: IncidentPhase | null;
  startIncident: (i: Omit<Incident, "startedAt" | "number">) => void;
  /** Called on a short interval; advances or ends the incident. */
  tickIncident: () => void;
};

export type Incident = {
  id: string;
  label: string;
  stage: StageId;
  severity: "warning" | "error";
  lines: [string, string, string];
  startedAt: number; // performance.now() ms
  number: number;
};

let incidentCount = 0;

/** Seconds since the current incident started, or -1. Cheap enough to call per frame. */
export function incidentClock() {
  const i = useMachine.getState().incident;
  return i ? (performance.now() - i.startedAt) / 1000 : -1;
}

/** The signal the sim needs right now, or null when nothing is broken. */
export function chaosSignal(): ChaosSignal | null {
  const i = useMachine.getState().incident;
  if (!i) return null;
  const s = (performance.now() - i.startedAt) / 1000;
  return { id: i.id, fault: faultAt(s), repair: repairAt(s) };
}

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
  incident: null,
  phase: null,
  startIncident: (i) => {
    if (get().incident) return;
    set({ incident: { ...i, startedAt: performance.now(), number: ++incidentCount }, phase: "inject" });
  },
  tickIncident: () => {
    const i = get().incident;
    if (!i) return;
    const phase = phaseAt((performance.now() - i.startedAt) / 1000);
    if (!phase) set({ incident: null, phase: null });
    else if (phase !== get().phase) set({ phase });
  },
}));
