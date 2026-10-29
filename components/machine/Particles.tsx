"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Source } from "@/lib/content";
import { createFlow, makeRecords, type FlowRecord, type Leg } from "./flow/sim";
import { payloadFor } from "./flow/payload";
import { makeParticleMaterial } from "./shaders/particles";

/** Every record in flight, drawn as one Points draw call. Hover one to read it. */
export function Particles({ sources, count }: { sources: Source[]; count: number }) {
  const { size, camera, clock } = useThree();
  const records = useMemo(() => makeRecords(count), [count]);
  const flow = useMemo(() => createFlow(sources.map((s) => s.color)), [sources]);
  const mat = useMemo(makeParticleMaterial, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const attr = (n: number) => new THREE.BufferAttribute(new Float32Array(count * n), n).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", attr(3));
    g.setAttribute("color", attr(3));
    g.setAttribute("aAlpha", attr(1));
    g.setAttribute("aJitter", attr(1));
    // positions change every frame, so give raycasting a fixed, generous bound
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    return g;
  }, [count]);

  const [hover, setHover] = useState<{ record: FlowRecord; leg: Leg } | null>(null);
  const anchor = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flow.step(records, t, {
      position: geo.attributes.position.array as Float32Array,
      color: geo.attributes.color.array as Float32Array,
      alpha: geo.attributes.aAlpha.array as Float32Array,
      jitter: geo.attributes.aJitter.array as Float32Array,
    });
    for (const k of ["position", "color", "aAlpha", "aJitter"]) geo.attributes[k].needsUpdate = true;
    mat.uniforms.uTime.value = t;
    const fov = (camera as THREE.PerspectiveCamera).fov;
    mat.uniforms.uScale.value = (size.height * Math.min(window.devicePixelRatio, 2)) / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    if (hover && anchor.current) {
      const pos = geo.attributes.position.array as Float32Array;
      const i = hover.record.id;
      anchor.current.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      // keep the payload's _layer honest as the record moves on
      const leg = flow.legAt(hover.record, t);
      if (leg !== hover.leg) setHover({ record: hover.record, leg });
    }
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const i = e.index;
    if (i === undefined) return;
    const alpha = (geo.attributes.aAlpha.array as Float32Array)[i];
    if (alpha < 0.2) return;
    e.stopPropagation();
    if (hover?.record.id === i) return;
    const record = records[i];
    setHover({ record, leg: flow.legAt(record, clock.elapsedTime) });
    mat.uniforms.uHover.value = i;
    document.body.style.cursor = "crosshair";
  };
  const onOut = () => {
    setHover(null);
    mat.uniforms.uHover.value = -1;
    document.body.style.cursor = "";
  };

  return (
    <>
      <points geometry={geo} material={mat} frustumCulled={false} onPointerMove={onMove} onPointerOut={onOut} />
      <group ref={anchor}>
        {hover && (
          <Html style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
            <div className="ml-4 -translate-y-1/2 rounded-md border border-cyan/25 bg-void/80 px-4 py-3 shadow-[0_0_40px_rgba(127,216,255,0.08)] backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between gap-6 font-mono text-[9px] tracking-[0.22em] text-mute uppercase">
                <span style={{ color: sources[hover.record.source]?.color }}>{sources[hover.record.source]?.label}</span>
                <span className={hover.record.bad ? "text-error" : "text-cyan/70"}>{hover.record.bad ? "malformed" : "record"}</span>
              </div>
              <pre className="font-mono text-[11px] leading-[1.55] whitespace-pre text-ink/85">{payloadFor(hover.record, hover.leg, sources)}</pre>
            </div>
          </Html>
        )}
      </group>
    </>
  );
}
