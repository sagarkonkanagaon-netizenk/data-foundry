"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { flyTo } from "@/components/Tour";
import { LAYOUT } from "./layout";

// Invisible click targets over each chamber. Clicking one flies the camera to that
// stage and brings its glass caption into view.
const BOXES: { stage: string; pos: [number, number, number]; size: [number, number, number] }[] = [
  { stage: "intake", pos: [LAYOUT.intake.x, -0.2, 0], size: [2.2, 3.6, 3.2] },
  { stage: "bronze", pos: [LAYOUT.bronze.x, 0, 0], size: [2.6, 3.8, 2.6] },
  { stage: "spark", pos: [LAYOUT.spark.x, 0, 0], size: [2.8, 3.4, 2.8] },
  { stage: "silver", pos: [LAYOUT.silver.x, 0, 0], size: [2.6, 3.8, 2.6] },
  { stage: "gold", pos: [LAYOUT.gold.x, 0, 0], size: [3.2, 3.8, 3.2] },
  { stage: "orchestrator", pos: [0, LAYOUT.dag.y, LAYOUT.dag.z], size: [13.4, 0.9, 0.6] },
];

export const pointerHandlers = (stage: string) => ({
  onClick: (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    flyTo(stage);
  },
  // no stopPropagation here: particles inside the box still need their hover events
  onPointerOver: () => {
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "";
  },
});

export function Hitboxes() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }), []);
  return (
    <group>
      {BOXES.map((b) => (
        <mesh key={b.stage} position={b.pos} material={mat} {...pointerHandlers(b.stage)}>
          <boxGeometry args={b.size} />
        </mesh>
      ))}
    </group>
  );
}
