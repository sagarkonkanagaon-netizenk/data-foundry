"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { LAYOUT, PALETTE } from "./layout";
import { HOT, live, RINGS, SPARK_YAW } from "./geometry";
import { incidentClock, useMachine } from "@/lib/machine/store";
import { faultAt } from "@/lib/machine/chaos";
import { makeGlowMaterial } from "./shaders/glow";

// A gyroscope of executor rings. Each node on a ring is one executor/task slot.
// Spin speed follows live throughput from the sim.

function Ring({ index, r, nodes, tilt, speed }: (typeof RINGS)[number] & { index: number }) {
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

  const throughput = useRef(0.6);
  const hot = useRef<THREE.Mesh>(null);
  const hotPos = useMemo<[number, number, number]>(() => {
    const a = (HOT.node / nodes) * Math.PI * 2;
    return [0, Math.cos(a) * r, Math.sin(a) * r];
  }, [nodes, r]);
  useFrame((_, dt) => {
    if (!spin.current) return;
    const target = useMachine.getState().metrics?.throughput ?? 0.6;
    throughput.current += (target - throughput.current) * Math.min(1, dt * 1.5);
    spin.current.rotation.x += dt * speed * (0.25 + throughput.current * 1.4);
    if (hot.current) {
      // the overloaded executor in a skewed partition
      const inc = useMachine.getState().incident;
      const f = inc?.id === "skewed-partition" ? faultAt(incidentClock()) : 0;
      hot.current.visible = f > 0.01;
      hot.current.scale.setScalar(0.4 + f * (1.6 + 0.3 * Math.sin(performance.now() / 90)));
    }
    live.sparkSpin[index] = spin.current.rotation.x;
  });

  return (
    <group rotation={tilt}>
      <group ref={spin}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[r, 0.008, 8, 192]} />
          <meshBasicMaterial color={PALETTE.violet} transparent opacity={0.55} toneMapped={false} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[r, 0.03, 12, 192]} />
          <meshStandardMaterial color="#141024" metalness={0.8} roughness={0.35} transparent opacity={0.6} />
        </mesh>
        {index === HOT.ring && (
          <mesh ref={hot} position={hotPos} visible={false}>
            <sphereGeometry args={[0.09, 20, 14]} />
            <meshBasicMaterial color={PALETTE.amber} toneMapped={false} />
          </mesh>
        )}
        <instancedMesh ref={inst} args={[undefined, undefined, nodes]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshBasicMaterial color="#c4b8ff" toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  );
}

export function SparkCore() {
  const core = useRef<THREE.Mesh>(null);
  const glow = useMemo(() => makeGlowMaterial(PALETTE.violet), []);
  useFrame(({ clock }) => {
    if (!core.current) return;
    core.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.1) * 0.06);
  });
  return (
    <group position={[LAYOUT.spark.x, 0, 0]} rotation={[0, SPARK_YAW, 0]}>
      {RINGS.map((ring, i) => (
        <Ring key={i} index={i} {...ring} />
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
