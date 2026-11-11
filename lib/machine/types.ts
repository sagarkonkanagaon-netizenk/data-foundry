// Shapes shared by the main thread and the simulation worker.

import type { ChaosSignal } from "./chaos";

export type TaskState = "queued" | "running" | "success" | "failed";
export type StageId = "intake" | "bronze" | "spark" | "silver" | "gold";

export type DagState = {
  /** The pipeline run being replayed, e.g. 20261111T191702Z. */
  runId: string;
  tasks: { id: string; state: TaskState }[];
};

export type LiveTransforms = { sparkSpin: number[]; latticeRot: number; goldRot: number; goldY: number };

/** What the particle flow takes from the latest real run. */
export type FlowShape = { badRate: number; density: number };

export type ToWorker =
  | { type: "init-flow"; count: number; colors: string[]; shape: FlowShape }
  | {
      type: "flow";
      t: number;
      live: LiveTransforms;
      chaos: ChaosSignal | null;
      position: Float32Array;
      color: Float32Array;
      alpha: Float32Array;
      jitter: Float32Array;
    };

export type FromWorker = { type: "flow"; position: Float32Array; color: Float32Array; alpha: Float32Array; jitter: Float32Array };

/** Which machine chambers light up while each pipeline stage runs (see pipeline/foundry/run.py). */
export const TASK_STAGE: Record<string, StageId[]> = {
  extract: ["intake"],
  bronze: ["bronze"],
  schema: ["bronze"],
  silver: ["spark", "silver"],
  gold: ["gold"],
  quality: ["silver", "gold"],
  retention: [],
};
