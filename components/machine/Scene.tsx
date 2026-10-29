"use client";

import { useMemo, useRef } from "react";
import { SHOTS, TOUR_STAGES, tour, type Shot } from "@/lib/machine/tour";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import type { Stage } from "@/lib/content";
import { GlassBuffer } from "./Glass";
import { BronzeChamber, GoldChamber, QuarantinePod, SilverChamber } from "./Chambers";
import { SparkCore } from "./SparkCore";
import { Conduits, IntakePorts, Spine } from "./Plumbing";
import { Orchestrator } from "./Orchestrator";
import { Sentinel } from "./Sentinel";
import { Particles } from "./Particles";
import { ShuffleArcs } from "./ShuffleArcs";
import { Backdrop, Dust } from "./Atmosphere";
import { PALETTE } from "./layout";
import { Hitboxes } from "./Hitboxes";

export type Quality = "high" | "low";

/**
 * Slow, weighted camera. At the top of the page it holds a three-quarter hero view
 * with idle drift and a lean toward the pointer; as the page scrolls it flies the
 * tour from shot to shot, easing in and holding while each caption is read.
 */
function CameraRig() {
  const { camera, pointer, size } = useThree();
  const pos = useRef(new THREE.Vector3(-6.5, 3, 22));
  const look = useRef(new THREE.Vector3(-0.3, -1.2, 0));
  const wantPos = useMemo(() => new THREE.Vector3(), []);
  const wantLook = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  // Pull back on narrow screens so the whole machine stays in frame.
  const aspectPull = THREE.MathUtils.clamp(1.6 / (size.width / size.height), 1, 1.9);
  const dist = 23.5 * aspectPull;

  const shots = useMemo(() => {
    const hero: Shot = { pos: [-6.5, 3.0, dist], look: [-0.3, -1.2, 0] };
    const list = [hero, SHOTS.intro, ...TOUR_STAGES.map((s) => SHOTS[s])];
    // narrow screens: back every close-up away from its subject
    return list.map((s, i) =>
      i === 0 ? s : { pos: s.pos.map((v, k) => s.look[k] + (v - s.look[k]) * aspectPull) as Shot["pos"], look: s.look },
    );
  }, [dist, aspectPull]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const u = THREE.MathUtils.clamp(tour.u, 0, shots.length - 1);
    const i = Math.min(Math.floor(u), shots.length - 2);
    const f = THREE.MathUtils.smoothstep(u - i, 0.15, 0.85);
    wantPos.copy(a.fromArray(shots[i].pos)).lerp(b.fromArray(shots[i + 1].pos), f);
    wantLook.copy(a.fromArray(shots[i].look)).lerp(b.fromArray(shots[i + 1].look), f);
    // idle drift and pointer lean, softened once we're touring close-ups
    const sway = u < 1 ? 1 : 0.35;
    wantPos.x += (Math.sin(t * 0.05) * 0.8 + pointer.x * 1.1) * sway;
    wantPos.y += (Math.sin(t * 0.07) * 0.3 + pointer.y * 0.5) * sway;
    const k = 1 - Math.exp(-dt * 1.6);
    pos.current.lerp(wantPos, k);
    look.current.lerp(wantLook, k);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  return null;
}

function Ready({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    // wait a few frames so shaders are compiled and the first glass buffer is filled
    if (++frames.current > 8) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

function Machine({ stages, quality }: { stages: Stage[]; quality: Quality }) {
  const intake = stages.find((s) => s.id === "intake");
  const orchestrator = stages.find((s) => s.id === "orchestrator");
  return (
    <GlassBuffer resolution={quality === "high" ? 1024 : 512}>
      <group position={[0.4, 0, 0]}>
        <IntakePorts sources={intake?.sources ?? []} />
        <BronzeChamber />
        <Conduits />
        <SparkCore />
        <ShuffleArcs />
        <SilverChamber />
        <QuarantinePod />
        <GoldChamber />
        <Spine />
        <Orchestrator tasks={orchestrator?.tasks ?? []} />
        <Sentinel />
        <Hitboxes />
        <Particles sources={intake?.sources ?? []} count={quality === "high" ? 2400 : 900} />
      </group>
    </GlassBuffer>
  );
}

export default function Scene({ stages, quality = "high", paused = false, onReady }: { stages: Stage[]; quality?: Quality; paused?: boolean; onReady: () => void }) {
  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ fov: 30, position: [-6.5, 3, 22], near: 0.1, far: 120 }}
      gl={{ antialias: quality === "low", powerPreference: "high-performance", alpha: false }}
      raycaster={{ params: { Points: { threshold: 0.07 } } as THREE.RaycasterParameters }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(PALETTE.void);
        scene.fog = new THREE.Fog(PALETTE.void, 24, 50);
      }}
    >
      <Backdrop />
      <Dust count={quality === "high" ? 1400 : 500} />

      <ambientLight intensity={0.15} />
      <directionalLight position={[-3, 8, 7]} intensity={1.1} color="#cfe6ff" />
      <Environment resolution={256} frames={1}>
        {/* Studio strips: these are what draw the long, thin highlights on the glass. */}
        <Lightformer form="rect" intensity={3} color="#d8ecff" position={[0, 6, 4]} scale={[14, 0.35, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} color={PALETTE.cyan} position={[-8, 1, 4]} scale={[0.4, 8, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.4} color={PALETTE.violet} position={[8, 1, 3]} scale={[0.4, 8, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.2} color="#ffffff" position={[0, 2, 10]} scale={4} />
        <Lightformer form="rect" intensity={0.6} color="#7f8cff" position={[0, -5, 2]} scale={[12, 0.5, 1]} rotation-x={-Math.PI / 2} />
        {/* broad, dim fill behind the camera so machined metal reads as graphite, not black */}
        <Lightformer form="rect" intensity={0.35} color="#9fb4d0" position={[-4, 2, 16]} scale={[30, 8, 1]} />
      </Environment>

      <Machine stages={stages} quality={quality} />
      <CameraRig />
      <Ready onReady={onReady} />

      {quality === "high" ? (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.2} radius={0.72} />
          <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0007)} radialModulation modulationOffset={0.35} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.22} darkness={0.78} />
          <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}
