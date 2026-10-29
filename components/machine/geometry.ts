import * as THREE from "three";
import { LAYOUT } from "./layout";

// Shared shapes and live transforms. Both the visible parts and the particle flow read
// from here, so a particle headed for an executor node lands on the node you see.

/** Mutable per-frame state written by the animated parts, read by the flow sim. */
export const live = {
  sparkSpin: [0, 0, 0],
  latticeRot: 0,
  goldRot: 0,
  goldY: 0,
};

export const PORT_OFFSETS: [number, number, number][] = [
  [-0.4, 1.7, -1.3],
  [0, 0.6, 0.9],
  [0, -0.55, -1.0],
  [-0.4, -1.65, 0.85],
];

export function intakeCurve(i: number) {
  const [dx, y, z] = PORT_OFFSETS[i];
  const start = new THREE.Vector3(LAYOUT.intake.x + dx, y, z);
  const end = new THREE.Vector3(LAYOUT.bronze.x - LAYOUT.bronze.radius + 0.05, y * 0.45, z * 0.3);
  return new THREE.CubicBezierCurve3(start, start.clone().add(new THREE.Vector3(1.3, 0, 0)), end.clone().add(new THREE.Vector3(-1.1, 0, 0)), end);
}

export const SPARK_YAW = -0.75;
export const RINGS = [
  { r: 0.95, nodes: 8, tilt: [0, 0, 0] as [number, number, number], speed: 0.35 },
  { r: 1.3, nodes: 12, tilt: [0.32, 0, 0.18] as [number, number, number], speed: -0.24 },
  { r: 1.65, nodes: 16, tilt: [-0.26, 0, -0.22] as [number, number, number], speed: 0.16 },
];

/** Silver's guide lattice, in the chamber's local space. */
export function latticePoints() {
  const pts: THREE.Vector3[] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -3; j <= 3; j++)
      for (let k = -2; k <= 2; k++) {
        if (i * i + k * k > 6) continue;
        pts.push(new THREE.Vector3(i * 0.32, j * 0.38, k * 0.32));
      }
  return pts;
}

export function quarantineCurve() {
  const { x, y, z, radius } = LAYOUT.quarantine;
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(LAYOUT.silver.x + 0.5, -LAYOUT.silver.height / 2 - 0.1, 0.3),
    new THREE.Vector3(LAYOUT.silver.x + 0.9, -2.4, 0.7),
    new THREE.Vector3(x - radius * 0.9, y + 0.1, z),
  ]);
}

// Gold is a cluster of hexagonal columns: ordered, faceted, each one a business-ready
// table. Heights are fixed so the silhouette is the same on every load.
export const COLUMNS = [
  { a: 0, d: 0, h: 1.15, r: 0.24 },
  ...[0.85, 0.65, 0.92, 0.72, 0.8, 0.68].map((h, i) => ({ a: (i / 6) * Math.PI * 2 + 0.3, d: 0.42, h, r: 0.16 })),
  ...[0.48, 0.4, 0.5, 0.42].map((h, i) => ({ a: (i / 4) * Math.PI * 2 + 1.1, d: 0.72, h, r: 0.11 })),
];
