"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html } from "@react-three/drei";
import { LAYOUT, PALETTE } from "./layout";
import { makeBeamMaterial } from "./shaders/beam";
import { makeGlowMaterial } from "./shaders/glow";
import { incidentClock, useMachine } from "@/lib/machine/store";
import { faultAt, repairAt } from "@/lib/machine/chaos";
import type { StageId } from "@/lib/machine/types";
import { pointerHandlers } from "./Hitboxes";

const STAGE_X: Record<StageId, number> = {
  intake: LAYOUT.intake.x + 1.2,
  bronze: LAYOUT.bronze.x,
  spark: LAYOUT.spark.x,
  silver: LAYOUT.silver.x,
  gold: LAYOUT.gold.x,
};

/** Types its text out character by character, like a terminal. */
function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((k) => (k >= text.length ? (clearInterval(id), k) : k + 1)), 22);
    return () => clearInterval(id);
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      <span className="animate-pulse">▍</span>
    </>
  );
}

/** The floating log line that hangs off the orb during an incident. */
function LogLine() {
  const incident = useMachine((s) => s.incident);
  const phase = useMachine((s) => s.phase);
  if (!incident || !phase || phase === "inject") return null;
  const text = phase === "detect" ? incident.lines[0] : phase === "diagnose" ? incident.lines[1] : phase === "heal" ? incident.lines[2] : "✓ flow restored";
  const tone = phase === "heal" || phase === "recovered" ? "text-cyan" : incident.severity === "error" ? "text-error" : "text-amber";
  const tag = phase === "detect" ? "DETECT" : phase === "diagnose" ? "DIAGNOSE" : phase === "heal" ? "HEAL" : "OK";
  return (
    <Html position={[0.25, 0.32, 0]} style={{ pointerEvents: "none" }} zIndexRange={[15, 0]}>
      <div className="flex w-[min(78vw,440px)] items-start gap-2 font-mono text-[11px] leading-snug">
        <span aria-hidden className="mt-[7px] h-px w-6 shrink-0 bg-current opacity-50" />
        <div className={`${tone} drop-shadow-[0_0_8px_rgba(5,7,13,0.9)]`}>
          <span className="mr-2 text-[9px] tracking-[0.25em] opacity-70">{tag}</span>
          <Typewriter text={text} />
        </div>
      </div>
    </Html>
  );
}

/** The AI Sentinel: drifts and scans while all is well; flies to a fault, diagnoses it and beams the repair. */
export function Sentinel() {
  const orb = useRef<THREE.Group>(null);
  const cone = useRef<THREE.Group>(null);
  const shock = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const glow = useMemo(() => makeGlowMaterial(PALETTE.sentinel), []);
  const beam = useMemo(() => makeBeamMaterial(PALETTE.cyan, 0.2), []);
  const shockMat = useMemo(() => new THREE.MeshBasicMaterial({ color: PALETTE.amber, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const colors = useMemo(() => ({ idle: new THREE.Color(PALETTE.cyan), warn: new THREE.Color(PALETTE.amber), err: new THREE.Color(PALETTE.error), heal: new THREE.Color("#c9f3ff") }), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (!orb.current || !cone.current) return;
    const inc = useMachine.getState().incident;
    const s = incidentClock();
    const fault = inc ? faultAt(s) : 0;
    const repair = inc ? repairAt(s) : 0;
    const engaged = inc && s > 0.6 ? 1 : 0;

    if (inc && engaged) {
      // fly over the faulty stage and hold there
      target.set(STAGE_X[inc.stage], 2.35 + Math.sin(t * 2.2) * 0.05, 1.1);
    } else {
      // slow lissajous drift: crosses the whole machine roughly once a minute
      target.set(Math.sin(t * 0.1) * 6.2, 2.55 + Math.sin(t * 0.37) * 0.18, 1.5 + Math.cos(t * 0.13) * 0.7);
    }
    orb.current.position.lerp(target, 1 - Math.exp(-dt * (inc ? 1.8 : 3)));

    // beam: lean into travel when idle, point straight down when working
    cone.current.rotation.z = inc ? 0 : -Math.cos(t * 0.1) * 0.18;
    const narrow = 1 - repair * 0.45;
    cone.current.scale.set(narrow, 1, narrow);
    tmp.copy(colors.idle).lerp(inc?.severity === "error" ? colors.err : colors.warn, fault * (1 - repair)).lerp(colors.heal, repair);
    beam.uniforms.uColor.value.copy(tmp);
    beam.uniforms.uOpacity.value = 0.2 + fault * 0.18 + repair * 0.55;
    beam.uniforms.uTime.value = t;

    // pulse: slow breathing when calm, quick heartbeat while diagnosing
    const rate = inc && fault > 0.2 && repair < 0.1 ? 6 : 1.3;
    glow.uniforms.uPulse.value = 0.5 + 0.5 * Math.sin(t * rate);
    glow.uniforms.uColor.value.set(PALETTE.sentinel).lerp(tmp, 0.35 * fault);
    if (light.current) {
      light.current.color.copy(tmp);
      light.current.intensity = 4 + fault * 4 + repair * 10;
    }

    // detection shockwave around the faulty chamber
    if (shock.current) {
      const on = inc && s > 2.0 && s < 7.2;
      shock.current.visible = !!on;
      if (on && inc) {
        const k = ((s - 2.0) % 1.4) / 1.4;
        shock.current.position.set(STAGE_X[inc.stage], 0, 0);
        shock.current.scale.setScalar(0.6 + k * 2.4);
        shockMat.opacity = (1 - k) * 0.55;
        shockMat.color.set(inc.severity === "error" ? PALETTE.error : PALETTE.amber);
      }
    }
  });

  return (
    <>
      <group ref={orb}>
        <Billboard>
          <mesh material={glow}>
            <planeGeometry args={[1.6, 1.6]} />
          </mesh>
        </Billboard>
        <mesh {...pointerHandlers("sentinel")}>
          <sphereGeometry args={[0.11, 32, 24]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <group ref={cone}>
          <mesh position={[0, -1.35, 0]} material={beam}>
            <coneGeometry args={[1.15, 2.6, 64, 1, true]} />
          </mesh>
        </group>
        <pointLight ref={light} color={PALETTE.cyan} intensity={4} distance={4.5} decay={2} />
        <LogLine />
      </group>
      <mesh ref={shock} material={shockMat} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[1.0, 1.03, 96]} />
      </mesh>
    </>
  );
}
