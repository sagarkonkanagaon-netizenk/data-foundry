import { create } from "zustand";
import type { DagState, StageId } from "./types";
import { faultAt, phaseAt, repairAt, type ChaosSignal, type IncidentPhase } from "./chaos";
import { TASK_STAGE } from "./types";

type MachineState = {
  /** 0..1, how busy the latest real run was; spins the Spark core. */
  throughput: number;
  /** The replay of a real run's stages (see lib/machine/replay.ts). */
  dag: DagState | null;
  /** Chambers whose pipeline stage is running in the replay right now. */
  activeStages: Set<StageId>;
  apply: (dag: DagState) => void;
  setThroughput: (t: number) => void;
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
  /** Set when this replays something that happened in a real run; absent for a simulated drill. */
  real?: { runId: string; path: string; summary: string };
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

export const useMachine = create<MachineState>((set, get) => ({
  throughput: 0.5,
  dag: null,
  activeStages: new Set(),
  apply: (dag) => {
    const activeStages = new Set<StageId>();
    for (const t of dag.tasks) if (t.state === "running") for (const s of TASK_STAGE[t.id] ?? []) activeStages.add(s);
    set({ dag, activeStages });
  },
  setThroughput: (throughput) => set({ throughput }),
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
