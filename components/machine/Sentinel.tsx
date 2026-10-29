"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { PALETTE } from "./layout";
import { makeBeamMaterial } from "./shaders/beam";
import { makeGlowMaterial } from "./shaders/glow";

/** The AI Sentinel: a soft orb that drifts around the machine and sweeps a scan cone. */
export function Sentinel() {
  const orb = useRef<THREE.Group>(null);
  const cone = useRef<THREE.Group>(null);
  const glow = useMemo(() => makeGlowMaterial(PALETTE.sentinel), []);
  const beam = useMemo(() => makeBeamMaterial(PALETTE.cyan, 0.2), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!orb.current || !cone.current) return;
    // slow lissajous drift: crosses the whole machine roughly once a minute
    const x = Math.sin(t * 0.1) * 6.2;
    orb.current.position.set(x, 2.55 + Math.sin(t * 0.37) * 0.18, 1.5 + Math.cos(t * 0.13) * 0.7);
    // the cone leans slightly toward the direction of travel, like it's reading ahead
    cone.current.rotation.z = -Math.cos(t * 0.1) * 0.18;
    beam.uniforms.uTime.value = t;
    glow.uniforms.uPulse.value = 0.5 + 0.5 * Math.sin(t * 1.3);
  });

  return (
    <group ref={orb}>
      <Billboard>
        <mesh material={glow}>
          <planeGeometry args={[1.6, 1.6]} />
        </mesh>
      </Billboard>
      <mesh>
        <sphereGeometry args={[0.11, 32, 24]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <group ref={cone}>
        <mesh position={[0, -1.35, 0]} material={beam}>
          <coneGeometry args={[1.15, 2.6, 64, 1, true]} />
        </mesh>
      </group>
      <pointLight color={PALETTE.cyan} intensity={4} distance={4.5} decay={2} />
    </group>
  );
}
