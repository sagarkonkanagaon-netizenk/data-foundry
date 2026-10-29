// Shapes shared by the main thread and the simulation worker.

export type TaskState = "queued" | "running" | "success" | "failed";
export type StageId = "intake" | "bronze" | "spark" | "silver" | "gold";

export type Metrics = {
  rowsPerSec: number;
  latencyMs: number;
  freshnessSec: number;
  dqScore: number; // percent
  costPerHr: number; // USD
  throughput: number; // 0..1, drives Spark spin
  rowsToday: number;
  quarantined: number;
};

export type DagState = {
  runId: number;
  tasks: { id: string; state: TaskState }[];
};

export type LiveTransforms = { sparkSpin: number[]; latticeRot: number; goldRot: number; goldY: number };

export type ToWorker =
  | { type: "metrics"; tasks: string[] }
  | { type: "init-flow"; count: number; colors: string[] }
  | { type: "flow"; t: number; live: LiveTransforms; position: Float32Array; color: Float32Array; alpha: Float32Array; jitter: Float32Array };

export type FromWorker =
  | { type: "tick"; metrics: Metrics; dag: DagState }
  | { type: "flow"; position: Float32Array; color: Float32Array; alpha: Float32Array; jitter: Float32Array };

/** Which machine stage each DAG task belongs to. */
export const TASK_STAGE: Record<string, StageId> = {
  extract: "intake",
  land_bronze: "bronze",
  spark_transform: "spark",
  dq_checks: "silver",
  merge_silver: "silver",
  build_gold: "gold",
  publish: "gold",
};
