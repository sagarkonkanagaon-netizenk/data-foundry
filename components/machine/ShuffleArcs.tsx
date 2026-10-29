"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { LAYOUT } from "./layout";
import { live, RINGS, SPARK_YAW } from "./geometry";

// The shuffle made visible: arcs between executor nodes on different rings, with a
// pulse running along each one. Endpoints follow the rings as they spin.
const ARCS = 26;
const SEG = 28;

export function ShuffleArcs({ intensity = 1 }: { intensity?: number }) {
  const pairs = useMemo(() => {
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: ARCS }, () => {
      const ra = Math.floor(rnd() * RINGS.length);
      const rb = (ra + 1 + Math.floor(rnd() * (RINGS.length - 1))) % RINGS.length;
      return { ra, na: Math.floor(rnd() * RINGS[ra].nodes), rb, nb: Math.floor(rnd() * RINGS[rb].nodes), seed: rnd() };
    });
  }, []);

  const mats = useMemo(
    () => RINGS.map((r) => new THREE.Matrix4().makeRotationY(SPARK_YAW).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...r.tilt)))),
    [],
  );

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = ARCS * (SEG - 1) * 2;
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const t = new Float32Array(n);
    const seed = new Float32Array(n);
    let k = 0;
    pairs.forEach((p) => {
      for (let i = 0; i < SEG - 1; i++) {
        t[k] = i / (SEG - 1);
        seed[k++] = p.seed;
        t[k] = (i + 1) / (SEG - 1);
        seed[k++] = p.seed;
      }
    });
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    return g;
  }, [pairs]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uIntensity: { value: intensity }, uColor: { value: new THREE.Color("#b7a9ff") } },
        vertexShader: /* glsl */ `
          attribute float aT;
          attribute float aSeed;
          varying float vT;
          varying float vSeed;
          void main() { vT = aT; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uIntensity;
          uniform vec3 uColor;
          varying float vT;
          varying float vSeed;
          void main() {
            float head = fract(uTime * (0.35 + vSeed * 0.3) + vSeed * 7.0) * 1.6 - 0.3;
            float pulse = smoothstep(0.25, 0.0, head - vT) * step(vT, head);   // tail behind the head
            float base = 0.07;
            float ends = smoothstep(0.0, 0.08, vT) * smoothstep(1.0, 0.92, vT);
            float a = (base + pulse * 0.9) * ends * uIntensity;
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
      }),
    [intensity],
  );

  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  const c = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const center = useMemo(() => new THREE.Vector3(LAYOUT.spark.x, 0, 0), []);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    const node = (ring: number, n: number, out: THREE.Vector3) => {
      const R = RINGS[ring];
      const phi = (n / R.nodes) * Math.PI * 2 + live.sparkSpin[ring];
      return out.set(0, Math.cos(phi) * R.r, Math.sin(phi) * R.r).applyMatrix4(mats[ring]).add(center);
    };
    const pos = geo.attributes.position.array as Float32Array;
    let k = 0;
    pairs.forEach((pr) => {
      node(pr.ra, pr.na, a);
      node(pr.rb, pr.nb, b);
      c.addVectors(a, b).multiplyScalar(0.5);
      c.add(p.copy(c).sub(center).normalize().multiplyScalar(1.1));
      let px = a.x, py = a.y, pz = a.z;
      for (let i = 1; i < SEG; i++) {
        const u = i / (SEG - 1);
        p.copy(a).multiplyScalar((1 - u) * (1 - u)).addScaledVector(c, 2 * u * (1 - u)).addScaledVector(b, u * u);
        pos[k++] = px; pos[k++] = py; pos[k++] = pz;
        pos[k++] = p.x; pos[k++] = p.y; pos[k++] = p.z;
        px = p.x; py = p.y; pz = p.z;
      }
    });
    geo.attributes.position.needsUpdate = true;
  });

  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />;
}
