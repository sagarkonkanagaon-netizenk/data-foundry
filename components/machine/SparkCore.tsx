"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { LAYOUT, PALETTE } from "./layout";
import { makeGlowMaterial } from "./shaders/glow";

// A gyroscope of executor rings. Each node on a ring is one executor/task slot.
// `throughput` (0..1) will drive spin speed from step 4 on.
const RINGS = [
  { r: 0.95, nodes: 8, tilt: [0, 0, 0], speed: 0.35 },
  { r: 1.3, nodes: 12, tilt: [0.32, 0, 0.18], speed: -0.24 },
  { r: 1.65, nodes: 16, tilt: [-0.26, 0, -0.22], speed: 0.16 },
] as const;

function Ring({ r, nodes, tilt, speed, throughput }: (typeof RINGS)[number] & { throughput: number }) {
  const spin = useRef<THREE.Group>(null);
  const inst = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < nodes; i++) {
      const a = (i / nodes) * Math.PI * 2;
      m.makeTranslation(0, Math.cos(a) * r, Math.sin(a) * r);
      inst.current!.setMatrixAt(i, m);
    }
    inst.current!.instanceMatrix.needsUpdate = true;
  }, [nodes, r]);

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.x += dt * speed * (0.4 + throughput);
  });

  return (
    <group rotation={tilt as unknown as [number, number, number]}>
      <group ref={spin}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[r, 0.008, 8, 192]} />
          <meshBasicMaterial color={PALETTE.violet} transparent opacity={0.55} toneMapped={false} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[r, 0.03, 12, 192]} />
          <meshStandardMaterial color="#141024" metalness={0.8} roughness={0.35} transparent opacity={0.6} />
        </mesh>
        <instancedMesh ref={inst} args={[undefined, undefined, nodes]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshBasicMaterial color="#c4b8ff" toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  );
}

export function SparkCore({ throughput = 0.5 }: { throughput?: number }) {
  const core = useRef<THREE.Mesh>(null);
  const glow = useMemo(() => makeGlowMaterial(PALETTE.violet), []);
  useFrame(({ clock }) => {
    if (!core.current) return;
    core.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.1) * 0.06);
  });
  return (
    <group position={[LAYOUT.spark.x, 0, 0]} rotation={[0, -0.75, 0]}>
      {RINGS.map((ring, i) => (
        <Ring key={i} {...ring} throughput={throughput} />
      ))}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.12, 3]} />
        <meshBasicMaterial color="#e4deff" toneMapped={false} />
      </mesh>
      <Billboard>
        <mesh material={glow}>
          <planeGeometry args={[1.4, 1.4]} />
        </mesh>
      </Billboard>
      <pointLight color={PALETTE.violet} intensity={5} distance={5} decay={2} />
      {/* axle */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 3.6, 16]} />
        <meshStandardMaterial color="#0c111b" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}
