"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, useFBO } from "@react-three/drei";
import { makeCausticsMaterial } from "./shaders/caustics";
import { makeFresnelMaterial } from "./shaders/fresnel";

// Every glass object refracts the same snapshot of the scene. Rendering one shared
// buffer per frame (instead of one per vessel) is what keeps four refracting vessels
// at 60fps.
type GlassCtx = { buffer: THREE.Texture; register: (o: THREE.Object3D) => () => void };
const Ctx = createContext<GlassCtx | null>(null);

export function GlassBuffer({ children, resolution = 1024 }: { children: React.ReactNode; resolution?: number }) {
  const fbo = useFBO(resolution, resolution, { samples: 0 });
  const glass = useRef(new Set<THREE.Object3D>());
  const { scene } = useThree();

  useFrame(({ gl, camera }) => {
    glass.current.forEach((o) => (o.visible = false));
    const bg = scene.background;
    gl.setRenderTarget(fbo);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    scene.background = bg;
    glass.current.forEach((o) => (o.visible = true));
  });

  const value = useMemo<GlassCtx>(
    () => ({
      buffer: fbo.texture,
      register: (o) => {
        glass.current.add(o);
        return () => glass.current.delete(o);
      },
    }),
    [fbo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useGlass(ref: React.RefObject<THREE.Object3D | null>) {
  const ctx = useContext(Ctx)!;
  useEffect(() => (ref.current ? ctx.register(ref.current) : undefined), [ctx, ref]);
  return ctx.buffer;
}

type Shape = "cylinder" | "capsule" | "sphere" | "tube";

export type GlassProps = {
  shape: Shape;
  radius: number;
  height?: number;
  /** For shape="tube": the curve the tube follows. */
  curve?: THREE.Curve<THREE.Vector3>;
  tint: string;
  rim: string;
  roughness?: number;
  thickness?: number;
  caustics?: number;
  rimIntensity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

/** A refracting glass vessel with a fresnel rim shell and (optionally) inner caustics. */
export function GlassVessel({
  shape,
  radius,
  height = 1,
  curve,
  tint,
  rim,
  roughness = 0.05,
  thickness = 0.5,
  caustics = 0,
  rimIntensity = 1.2,
  position,
  rotation,
}: GlassProps) {
  const glassRef = useRef<THREE.Mesh>(null);
  const buffer = useGlass(glassRef);

  const geometry = useMemo(() => {
    switch (shape) {
      case "cylinder":
        return new THREE.CylinderGeometry(radius, radius, height, 128, 1, true);
      case "capsule":
        return new THREE.CapsuleGeometry(radius, height - radius * 2, 24, 96);
      case "sphere":
        return new THREE.SphereGeometry(radius, 96, 64);
      case "tube":
        return new THREE.TubeGeometry(curve!, 96, radius, 24, false);
    }
  }, [shape, radius, height, curve]);

  const rimMat = useMemo(
    () => makeFresnelMaterial(rim, { intensity: rimIntensity, scan: shape === "tube" ? 0 : 0.35 }),
    [rim, rimIntensity, shape],
  );
  const causticMat = useMemo(() => (caustics > 0 ? makeCausticsMaterial(tint, caustics) : null), [tint, caustics]);

  useFrame(({ clock }) => {
    rimMat.uniforms.uTime.value = clock.elapsedTime;
    if (causticMat) causticMat.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={glassRef} geometry={geometry} renderOrder={2}>
        <MeshTransmissionMaterial
          buffer={buffer}
          side={THREE.DoubleSide}
          transmission={1}
          roughness={roughness}
          thickness={thickness}
          ior={1.22}
          chromaticAberration={0.05}
          anisotropicBlur={0.15}
          distortion={0.12}
          distortionScale={0.35}
          temporalDistortion={0.04}
          color={tint}
          attenuationColor={tint}
          attenuationDistance={6}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.1}
          samples={6}
        />
      </mesh>
      {causticMat && (
        <mesh geometry={geometry} scale={0.985} material={causticMat} renderOrder={3} />
      )}
      <mesh geometry={geometry} scale={1.004} material={rimMat} renderOrder={4} />
    </group>
  );
}

/** Machined end collar with an emissive hairline, used to cap the vessels. */
export function Collar({ radius, y, color }: { radius: number; y: number; color: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh>
        <cylinderGeometry args={[radius + 0.09, radius + 0.09, 0.2, 96]} />
        <meshStandardMaterial color="#3a4456" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, y > 0 ? -0.105 : 0.105, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius + 0.095, 0.006, 8, 128]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, y > 0 ? 0.11 : -0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.35, radius + 0.09, 96]} />
        <meshStandardMaterial color="#2a3344" metalness={0.65} roughness={0.32} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
