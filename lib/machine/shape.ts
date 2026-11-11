import type { RunReport } from "../runs";
import type { FlowShape } from "./types";

/**
 * How the latest real run shapes the particle flow: rows landed set how many particles
 * show, the reject rate sets how many turn red and go to quarantine. With no run
 * published yet, a thin trickle and none red.
 */
export function flowShape(latest: RunReport | null): FlowShape {
  if (!latest) return { badRate: 0, density: 0.12 };
  const landed = latest.rows.landed ?? latest.rows.bronze ?? 0;
  return { badRate: Math.min(1, latest.rejects?.rate ?? 0), density: Math.min(1, Math.max(0.12, landed / 5000)) };
}
