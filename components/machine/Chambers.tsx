"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Collar, GlassVessel } from "./Glass";
import { LAYOUT, PALETTE } from "./layout";

export function BronzeChamber() {
  const { x, radius, height } = LAYOUT.bronze;
  return (
    <group position={[x, 0, 0]}>
      {/* frosted: high roughness blurs what's behind it */}
      <GlassVessel shape="cylinder" radius={radius} height={height} tint="#efe2d2" rim={PALETTE.bronze} roughness={0.38} thickness={0.8} caustics={0.35} rimIntensity={0.9} />
      <Collar radius={radius} y={height / 2} color={PALETTE.bronze} />
      <Collar radius={radius} y={-height / 2} color={PALETTE.bronze} />
    </group>
  );
}

export function SilverChamber() {
  const { x, radius, height } = LAYOUT.silver;
  // Faint guide lattice. In step 3 the particles settle onto these points.
  const lattice = useMemo(() => {
    const pts: number[] = [];
    for (let i = -2; i <= 2; i++) for (let j = -3; j <= 3; j++) for (let k = -2; k <= 2; k++) {
      if (i * i + k * k > 6) continue;
      pts.push(i * 0.32, j * 0.38, k * 0.32);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.05;
  });
  return (
    <group position={[x, 0, 0]}>
      <GlassVessel shape="cylinder" radius={radius} height={height} tint="#e6f0fa" rim={PALETTE.silver} roughness={0.08} thickness={0.6} caustics={0.4} rimIntensity={1.3} />
      <points ref={ref} geometry={lattice}>
        <pointsMaterial color={PALETTE.silver} size={0.035} sizeAttenuation transparent opacity={0.55} toneMapped={false} />
      </points>
      <Collar radius={radius} y={height / 2} color={PALETTE.silver} />
      <Collar radius={radius} y={-height / 2} color={PALETTE.silver} />
    </group>
  );
}

export function QuarantinePod() {
  const { x, y, z, radius } = LAYOUT.quarantine;
  const core = useRef<THREE.Mesh>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(LAYOUT.silver.x + 0.5, -LAYOUT.silver.height / 2 - 0.1, 0.3),
        new THREE.Vector3(LAYOUT.silver.x + 0.9, -2.4, 0.7),
        new THREE.Vector3(x - radius * 0.9, y + 0.1, z),
      ]),
    [x, y, z, radius],
  );
  useFrame(({ clock }) => {
    if (!core.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 1.6) * 0.18;
    core.current.scale.setScalar(s);
  });
  return (
    <group>
      <GlassVessel shape="tube" curve={curve} radius={0.045} tint="#f0d0cc" rim={PALETTE.error} rimIntensity={0.6} />
      <GlassVessel shape="sphere" radius={radius} tint="#f5d5d0" rim={PALETTE.error} position={[x, y, z]} roughness={0.12} rimIntensity={1.1} />
      <mesh ref={core} position={[x, y, z]}>
        <sphereGeometry args={[0.07, 24, 16]} />
        <meshBasicMaterial color={PALETTE.error} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Gold is a cluster of hexagonal columns: ordered, faceted, each one a business-ready
// table. Heights are fixed so the silhouette is the same on every load.
const COLUMNS = [
  { a: 0, d: 0, h: 1.15, r: 0.24 },
  ...[0.85, 0.65, 0.92, 0.72, 0.8, 0.68].map((h, i) => ({ a: (i / 6) * Math.PI * 2 + 0.3, d: 0.42, h, r: 0.16 })),
  ...[0.48, 0.4, 0.5, 0.42].map((h, i) => ({ a: (i / 4) * Math.PI * 2 + 1.1, d: 0.72, h, r: 0.11 })),
];

function columnGeometry() {
  const body = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
  body.translate(0, 0.5, 0);
  const tip = new THREE.ConeGeometry(1, 0.9, 6, 1);
  tip.translate(0, 1.45, 0);
  const g = mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()])!;
  g.computeVertexNormals();
  return g;
}

export function GoldChamber() {
  const { x, radius } = LAYOUT.gold;
  const cluster = useRef<THREE.Group>(null);
  const geo = useMemo(columnGeometry, []);
  useFrame(({ clock }, dt) => {
    if (!cluster.current) return;
    cluster.current.rotation.y += dt * 0.12;
    cluster.current.position.y = Math.sin(clock.elapsedTime * 0.4) * 0.04;
  });
  return (
    <group position={[x, 0, 0]}>
      <GlassVessel shape="sphere" radius={radius} tint="#fffaf0" rim={PALETTE.gold} roughness={0.0} thickness={0.25} caustics={0.22} rimIntensity={0.9} />
      <group ref={cluster}>
        {COLUMNS.map((c, i) => (
          <mesh
            key={i}
            geometry={geo}
            position={[Math.cos(c.a) * c.d, -0.75, Math.sin(c.a) * c.d]}
            rotation={[Math.sin(c.a) * c.d * 0.3, 0, -Math.cos(c.a) * c.d * 0.3]}
            scale={[c.r, c.h, c.r]}
          >
            <meshPhysicalMaterial color="#f7d79a" emissive={PALETTE.gold} emissiveIntensity={0.18} roughness={0.08} metalness={0.15} clearcoat={1} flatShading iridescence={0.4} />
            <Edges color="#ffe2a6" threshold={15} lineWidth={0.6} />
          </mesh>
        ))}
      </group>
      <pointLight color={PALETTE.gold} intensity={3.5} distance={4} decay={2} />
      {/* cradle rings */}
      <mesh position={[0, -radius - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.55, 0.035, 12, 96]} />
        <meshStandardMaterial color="#0c111b" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, -radius - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.55, 0.006, 8, 128]} />
        <meshBasicMaterial color={PALETTE.gold} toneMapped={false} />
      </mesh>
    </group>
  );
}
