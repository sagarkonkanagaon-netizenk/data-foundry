"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { GlassVessel } from "./Glass";
import { LAYOUT, PALETTE } from "./layout";
import { intakeCurve } from "./geometry";
import type { Source } from "@/lib/content";

/** Intake nozzles at the left edge, one per source, piped into Bronze. */
export function IntakePorts({ sources }: { sources: Source[] }) {
  const ports = useMemo(
    () =>
      sources.slice(0, 4).map((s, i) => {
        const curve = intakeCurve(i);
        return { s, start: curve.v0, curve };
      }),
    [sources],
  );
  return (
    <group>
      {ports.map(({ s, start, curve }) => (
        <group key={s.id}>
          <group position={start} rotation={[0, 0, -Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.16, 0.22, 0.55, 48, 1, true]} />
              <meshStandardMaterial color="#0d121c" metalness={0.9} roughness={0.28} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22, 0.012, 8, 64]} />
              <meshBasicMaterial color={s.color} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.19, 48]} />
              <meshBasicMaterial color={s.color} transparent opacity={0.25} toneMapped={false} />
            </mesh>
          </group>
          <GlassVessel shape="tube" curve={curve} radius={0.06} tint="#dbe8f5" rim={s.color} rimIntensity={0.7} />
        </group>
      ))}
    </group>
  );
}

/** Straight glass pipes between the stages along the flow axis. */
export function Conduits() {
  const segs = useMemo(() => {
    const line = (a: number, b: number) => new THREE.LineCurve3(new THREE.Vector3(a, 0, 0), new THREE.Vector3(b, 0, 0));
    return [
      { c: line(LAYOUT.bronze.x + LAYOUT.bronze.radius - 0.05, LAYOUT.spark.x - 0.25), rim: PALETTE.bronze },
      { c: line(LAYOUT.spark.x + 0.25, LAYOUT.silver.x - LAYOUT.silver.radius + 0.05), rim: PALETTE.violet },
      { c: line(LAYOUT.silver.x + LAYOUT.silver.radius - 0.05, LAYOUT.gold.x - LAYOUT.gold.radius + 0.05), rim: PALETTE.silver },
    ];
  }, []);
  return (
    <group>
      {segs.map((s, i) => (
        <GlassVessel key={i} shape="tube" curve={s.c} radius={0.11} tint="#e3eef8" rim={s.rim} rimIntensity={0.8} />
      ))}
    </group>
  );
}

/** The structural spine the machine hangs from: a dark rail with an emissive hairline and struts. */
export function Spine() {
  const y = -2.25;
  const x0 = LAYOUT.bronze.x - 1.6;
  const x1 = LAYOUT.gold.x + 1.8;
  const struts = [LAYOUT.bronze.x, LAYOUT.spark.x, LAYOUT.silver.x, LAYOUT.gold.x];
  const tops = [-LAYOUT.bronze.height / 2 - 0.1, -1.75, -LAYOUT.silver.height / 2 - 0.1, -LAYOUT.gold.radius - 0.05];
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, y, -0.2]}>
        <boxGeometry args={[x1 - x0, 0.06, 0.32]} />
        <meshStandardMaterial color="#0b1019" metalness={0.9} roughness={0.35} />
      </mesh>
      <mesh position={[(x0 + x1) / 2, y + 0.032, -0.04]}>
        <boxGeometry args={[x1 - x0, 0.004, 0.004]} />
        <meshBasicMaterial color={PALETTE.cyan} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {struts.map((x, i) =>
        tops[i] - y > 0.05 ? (
          <mesh key={x} position={[x, (y + tops[i]) / 2, -0.2]}>
            <boxGeometry args={[0.05, tops[i] - y, 0.05]} />
            <meshStandardMaterial color="#0b1019" metalness={0.9} roughness={0.35} />
          </mesh>
        ) : null,
      )}
    </group>
  );
}
