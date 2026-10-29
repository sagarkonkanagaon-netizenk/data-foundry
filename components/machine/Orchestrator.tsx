"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { LAYOUT, PALETTE } from "./layout";
import { makeHologramMaterial } from "./shaders/hologram";

/** Holographic Airflow-style DAG floating above the machine. Idles through a run cycle. */
export function Orchestrator({ tasks }: { tasks: string[] }) {
  const { y, z, x0, x1 } = LAYOUT.dag;
  const nodes = useMemo(
    () => tasks.map((t, i) => ({ t, x: x0 + ((x1 - x0) * i) / Math.max(tasks.length - 1, 1), mat: makeHologramMaterial(PALETTE.cyan) })),
    [tasks, x0, x1],
  );

  const edges = useMemo(() => {
    const pts: number[] = [];
    nodes.forEach((n, i) => {
      if (i > 0) pts.push(nodes[i - 1].x + 0.2, y, z, n.x - 0.2, y, z);
      pts.push(n.x, y - 0.16, z, n.x, y - 0.45, z);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [nodes, y, z]);

  const edgeMat = useRef<THREE.LineBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // one task every 1.4s, then a short pause with everything lit before resetting
    const step = (t / 1.4) % (nodes.length + 3);
    nodes.forEach((n, i) => {
      n.mat.uniforms.uTime.value = t;
      const target = step >= nodes.length + 1 ? 0 : step > i + 1 ? 0.55 : step > i ? 1 : 0;
      n.mat.uniforms.uActive.value += (target - n.mat.uniforms.uActive.value) * 0.08;
    });
    if (edgeMat.current) edgeMat.current.opacity = 0.18 + Math.sin(t * 0.8) * 0.04;
  });

  return (
    <group>
      {nodes.map((n) => (
        <mesh key={n.t} position={[n.x, y, z]} material={n.mat}>
          <planeGeometry args={[0.4, 0.32]} />
        </mesh>
      ))}
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={edgeMat} color={PALETTE.cyan} transparent opacity={0.2} toneMapped={false} />
      </lineSegments>
    </group>
  );
}
