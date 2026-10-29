"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { makeBackdropMaterial } from "./shaders/backdrop";
import { makeDustMaterial } from "./shaders/dust";

export function Backdrop() {
  const mat = useMemo(makeBackdropMaterial, []);
  useFrame(({ clock }) => (mat.uniforms.uTime.value = clock.elapsedTime));
  return (
    <mesh position={[0, 0, -16]} material={mat} renderOrder={-1}>
      <planeGeometry args={[140, 70]} />
    </mesh>
  );
}

export function Dust({ count = 1400 }: { count?: number }) {
  const { gl } = useThree();
  const mat = useMemo(makeDustMaterial, []);
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = -12 + Math.random() * 20;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
