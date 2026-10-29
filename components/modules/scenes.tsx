"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "@/components/machine/layout";

// Seven small looping scenes, one per module capsule. Each is a pure function of time:
// instanced boxes whose position, scale and colour are recomputed every frame, so
// there is no state to drift and every loop plays the same.

const C = {
  cyan: new THREE.Color(PALETTE.cyan),
  violet: new THREE.Color(PALETTE.violet),
  amber: new THREE.Color(PALETTE.amber),
  error: new THREE.Color(PALETTE.error),
  gold: new THREE.Color(PALETTE.gold),
  bronze: new THREE.Color(PALETTE.bronze),
  silver: new THREE.Color(PALETTE.silver),
  white: new THREE.Color("#eaf6ff"),
  dim: new THREE.Color("#2b3648"),
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Lit like glass blocks, but each instance also emits a little of its own colour, so
// the scenes glow against the dark without a post-processing pass.
function glowing(m: THREE.MeshStandardMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n#ifdef USE_COLOR\n  totalEmissiveRadiance += vColor.rgb * 0.42;\n#endif",
    );
  };
  return m;
}

type Fn = (i: number, t: number, o: THREE.Object3D, c: THREE.Color) => void;

function Instances({
  count,
  fn,
  geometry,
  glow = false,
  opacity = 1,
}: {
  count: number;
  fn: Fn;
  geometry: THREE.BufferGeometry;
  glow?: boolean;
  opacity?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  const c = useMemo(() => new THREE.Color(), []);
  const material = useMemo(
    () =>
      glow
        ? new THREE.MeshBasicMaterial({
            toneMapped: false,
            transparent: opacity < 1,
            opacity,
          })
        : glowing(
            new THREE.MeshStandardMaterial({
              roughness: 0.3,
              metalness: 0.2,
              transparent: opacity < 1,
              opacity,
            }),
          ),
    [glow, opacity],
  );
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
      c.copy(C.white);
      fn(i, t, o, c);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

const box = (w = 1, h = 1, d = 1) => new THREE.BoxGeometry(w, h, d);

/** A dim floor and a soft rim light shared by every scene. */
export function Stage({
  children,
  y = -0.9,
}: {
  children: React.ReactNode;
  y?: number;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current)
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.22;
  });
  return (
    <>
      <hemisphereLight args={["#cfe6ff", "#05070d", 0.9]} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <pointLight
        position={[-3, 1.5, 2]}
        color={PALETTE.cyan}
        intensity={6}
        distance={9}
      />
      <group ref={group}>
        <gridHelper
          args={[12, 24, "#1d2a3c", "#121a26"]}
          position={[0, y, 0]}
        />
        {children}
      </group>
    </>
  );
}

/* ── LAB 01 · dedup within a watermark ───────────────────────────────────── */
// Records ride a lane through a glass watermark gate. Violet duplicates trail their
// twin and dissolve at the gate; amber late records drop in from above and are
// slotted in, turning clean once they pass.
function Dedup() {
  const N = 26;
  const geo = useMemo(() => box(0.26, 0.26, 0.26), []);
  const gate = 0.6;
  const fn: Fn = (i, t, o, c) => {
    const dup = i % 6 === 3;
    const late = i % 7 === 5;
    const base = dup ? i - 1 : i;
    const x = -3.6 + ((t * 0.75 + base * 0.29 + (dup ? -0.32 : 0)) % 7.2);
    const lane = (hash(base) - 0.5) * 0.5;
    let y = 0;
    if (late && x < gate) y = Math.max(0, 1.6 - (x + 3.6) * 0.75);
    const past = x > gate;
    c.copy(dup ? C.violet : late ? C.amber : C.white);
    if (past) {
      c.copy(C.cyan);
      if (dup) {
        const k = clamp01((x - gate) / 0.35);
        o.scale.setScalar(1 - k);
        c.copy(C.error).lerp(C.violet, k);
        y += k * 0.4;
      }
    }
    if (x > 3.4) o.scale.multiplyScalar(clamp01((3.6 - x) / 0.2));
    if (x < -3.4) o.scale.multiplyScalar(clamp01((x + 3.6) / 0.2));
    o.position.set(x, y - 0.55, lane);
    o.rotation.set(t * 0.3 + i, t * 0.2 + i, 0);
  };
  return (
    <Stage>
      <Instances count={N} fn={fn} geometry={geo} />
      {/* the watermark gate */}
      <mesh position={[gate, 0.1, 0]}>
        <boxGeometry args={[0.03, 1.9, 1.6]} />
        <meshBasicMaterial
          color={PALETTE.cyan}
          transparent
          opacity={0.18}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[gate, 1.06, 0]}>
        <boxGeometry args={[0.05, 0.02, 1.6]} />
        <meshBasicMaterial color={PALETTE.cyan} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.72, 0]}>
        <boxGeometry args={[7.4, 0.04, 0.9]} />
        <meshStandardMaterial color="#121a26" roughness={0.6} />
      </mesh>
    </Stage>
  );
}

/* ── LAB 02 · SCD Type 2 ─────────────────────────────────────────────────── */
// Five keys, one slab each. A change arrives from the right; the current version
// slides back into history (violet, dim) and the new one takes its place.
const SCD_EVENTS = [2, 0, 3, 2, 4, 1];
const SCD_GAP = 1.5;
const SCD_LOOP = SCD_EVENTS.length * SCD_GAP + 2.5;
function Scd2() {
  const keys = 5;
  const n = keys + SCD_EVENTS.length;
  const geo = useMemo(() => box(2.6, 0.2, 0.5), []);
  const fn: Fn = (i, tt, o, c) => {
    const t = tt % SCD_LOOP;
    const fade = clamp01((SCD_LOOP - t) / 0.6) * clamp01(t / 0.5);
    // which key this slab belongs to, and when it was created (-1 = initial)
    const key = i < keys ? i : SCD_EVENTS[i - keys];
    const born = i < keys ? -1 : i - keys;
    const p = (k: number) => ease((t - k * SCD_GAP - 0.2) / 1.0);
    // pushed back once for every later change to the same key
    let depth = 0;
    for (let k = born + 1; k < SCD_EVENTS.length; k++)
      if (SCD_EVENTS[k] === key) depth += p(k);
    let x = 0;
    let s = 1;
    if (born >= 0) {
      const a = p(born);
      x = (1 - a) * 4.2;
      s = a > 0 ? 1 : 0;
    }
    o.position.set(x - depth * 0.35, key * 0.34 - 0.75, -depth * 0.62);
    o.scale.set(1, 1, 1).multiplyScalar(s * fade);
    c.copy(born >= 0 && x > 0.05 ? C.white : C.cyan)
      .lerp(C.violet, clamp01(depth))
      .lerp(C.dim, clamp01(depth - 1) * 0.6);
  };
  return (
    <Stage>
      <Instances count={n} fn={fn} geometry={geo} />
    </Stage>
  );
}

/* ── LAB 03 · salting a skewed join ──────────────────────────────────────── */
// Eight partitions. One hot key towers over the rest; salting peels its extra rows
// off in arcs until every column carries the same load.
const SALT_FROM = [2, 3, 2, 14, 3, 2, 3, 2];
const SALT_TO = [4, 4, 4, 4, 4, 4, 4, 3];
const SALT_PLAN = (() => {
  // cubes: [col, level, toCol, toLevel]
  const out: [number, number, number, number][] = [];
  const fill = SALT_FROM.slice();
  const hot = 3;
  let level = SALT_TO[hot];
  SALT_FROM.forEach((h, col) => {
    for (let l = 0; l < h; l++) {
      if (col === hot && l >= SALT_TO[hot]) continue;
      out.push([col, l, col, l]);
    }
  });
  SALT_TO.forEach((target, col) => {
    while (col !== hot && fill[col] < target) {
      out.push([hot, level++, col, fill[col]++]);
    }
  });
  return out;
})();
function Salting() {
  const geo = useMemo(() => box(0.34, 0.15, 0.34), []);
  const loop = 10;
  const fn: Fn = (i, tt, o, c) => {
    const t = tt % loop;
    const [col, lvl, toCol, toLvl] = SALT_PLAN[i];
    const moving = col !== toCol;
    const order = moving ? lvl - SALT_TO[3] : 0;
    const p = moving ? ease((t - 3.4 - order * 0.16) / 0.9) : 0;
    const back = ease((t - 9.0) / 0.8);
    const k = p * (1 - back);
    const cx = (n: number) => (n - 3.5) * 0.62;
    const x = THREE.MathUtils.lerp(cx(col), cx(toCol), k);
    const y =
      THREE.MathUtils.lerp(lvl, toLvl, k) * 0.17 -
      0.82 +
      Math.sin(Math.PI * k) * 1.1;
    o.position.set(x, y, 0);
    // the hot partition glows amber until the salt has spread it out
    c.copy(col === 3 ? C.amber : C.cyan);
    if (col === 3)
      c.lerp(C.cyan, moving ? k : clamp01((t - 5) / 1.5) * (1 - back));
  };
  return (
    <Stage>
      <Instances count={SALT_PLAN.length} fn={fn} geometry={geo} />
    </Stage>
  );
}

/* ── LAB 04 · idempotent backfill ────────────────────────────────────────── */
// Twelve day-partitions. The run scans left to right, fails on day 7 (red), resumes
// from the gap, then the whole range is re-run: every tile flips as it is rewritten,
// but no tile ever grows. Same input, same table.
const DAYS = 12;
const dayX = (d: number) => (d - (DAYS - 1) / 2) * 0.5;
const PASSES: [number, number, number, number][] = [
  // [t0, t1, fromDay, toDay]
  [0.4, 3.0, 0, 7],
  [4.2, 5.6, 7, 11],
  [6.6, 9.4, 0, 11],
];
function scanAt(t: number) {
  for (const [t0, t1, a, b] of PASSES)
    if (t >= t0 && t <= t1) return a + ((t - t0) / (t1 - t0)) * (b - a);
  if (t > 3.0 && t < 4.2) return 7;
  return -10;
}
function crossings(d: number) {
  return PASSES.map(([t0, t1, a, b]) =>
    d >= a && d <= b ? t0 + ((d - a) / (b - a)) * (t1 - t0) : Infinity,
  );
}
function Backfill() {
  const geo = useMemo(() => box(0.38, 1, 0.38), []);
  const loop = 10.4;
  const fn: Fn = (i, tt, o, c) => {
    const t = tt % loop;
    const fade = clamp01((loop - t) / 0.5);
    const h = 0.45 + hash(i + 3) * 0.9;
    const cs = crossings(i);
    // day 7 fails on the first pass, so it is first loaded by the resume
    const firstLoad = i === 7 ? cs[1] : Math.min(...cs);
    const loaded = t >= firstLoad;
    let flip = 0;
    for (const tc of cs) if (t >= tc && t < tc + 0.6) flip = (t - tc) / 0.6;
    const height = loaded ? h : 0.06;
    o.scale.set(1, height * fade + 0.001, 1);
    o.position.set(dayX(i), -0.9 + (height * fade) / 2, 0);
    o.rotation.x = ease(flip) * Math.PI * 2;
    c.copy(loaded ? C.cyan : C.dim);
    if (flip > 0) c.lerp(C.white, 1 - flip);
    if (i === 7 && t > 3.0 && t < 4.2) c.copy(C.error);
  };
  const scanner = useRef<THREE.Mesh>(null);
  const scanMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: PALETTE.cyan,
        transparent: true,
        opacity: 0.5,
        toneMapped: false,
      }),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime % loop;
    const s = scanAt(t);
    if (!scanner.current) return;
    scanner.current.visible = s > -5;
    scanner.current.position.x = dayX(s);
    scanMat.color.copy(t > 3.0 && t < 4.2 ? C.error : C.cyan);
  });
  return (
    <Stage>
      <Instances count={DAYS} fn={fn} geometry={geo} />
      <mesh ref={scanner} position={[0, 0, 0]} material={scanMat}>
        <boxGeometry args={[0.02, 2.2, 1.0]} />
      </mesh>
    </Stage>
  );
}

/* ── CASE 01 · IoT telemetry ─────────────────────────────────────────────── */
// A field of devices pulses; readings arc into a growing stack of partitions.
// Some readings carry a new firmware schema (violet) and land just the same.
function Telemetry() {
  const G = 6;
  const P = 46;
  const dev = useMemo(() => box(0.16, 0.06, 0.16), []);
  const pkt = useMemo(() => box(0.07, 0.07, 0.07), []);
  const slab = useMemo(() => box(1.5, 0.12, 1.1), []);
  const devAt = (i: number, v: THREE.Vector3) =>
    v.set(-2.7 + (i % G) * 0.36, -0.85, -0.9 + Math.floor(i / G) * 0.36);
  const v = useMemo(() => new THREE.Vector3(), []);
  const devFn: Fn = (i, t, o, c) => {
    devAt(i, o.position);
    const pulse = Math.max(0, Math.sin(t * 2.2 + hash(i) * 20));
    o.scale.set(1, 1 + pulse * 2, 1);
    c.copy(C.dim).lerp(C.cyan, pulse * 0.8);
  };
  const pktFn: Fn = (i, t, o, c) => {
    const dur = 1.8;
    const ph = (t / dur + hash(i)) % 1;
    devAt(Math.floor(hash(i + 9) * G * G), v);
    const tx = 1.9;
    const ty = -0.7 + (Math.floor(t / 2.5) % 6) * 0.17;
    o.position.set(
      THREE.MathUtils.lerp(v.x, tx + (hash(i + 2) - 0.5) * 0.9, ph),
      THREE.MathUtils.lerp(v.y, ty, ph) + Math.sin(Math.PI * ph) * 1.4,
      THREE.MathUtils.lerp(v.z, (hash(i + 4) - 0.5) * 0.6, ph),
    );
    const fw = Math.floor(t / 4) % 2 === 1 && i % 3 === 0;
    c.copy(fw ? C.violet : C.cyan);
    o.scale.setScalar(Math.sin(Math.PI * ph) * 1.2);
  };
  const slabFn: Fn = (i, t, o, c) => {
    const filled = (Math.floor(t / 2.5) % 7) - i;
    const k = clamp01(filled);
    o.position.set(1.9, -0.82 + i * 0.17, 0);
    o.scale.set(1, k + 0.001, 1);
    c.copy(C.cyan).lerp(C.dim, 0.55);
  };
  return (
    <Stage>
      <Instances count={G * G} fn={devFn} geometry={dev} />
      <Instances count={P} fn={pktFn} geometry={pkt} glow />
      <Instances count={6} fn={slabFn} geometry={slab} opacity={0.85} />
    </Stage>
  );
}

/* ── CASE 02 · medallion lakehouse ───────────────────────────────────────── */
// Raw records fall through three plates: scattered and multicoloured above Bronze,
// lined up in Silver, merged into a few solid blocks in Gold.
function Lakehouse() {
  const N = 36;
  const geo = useMemo(() => box(0.16, 0.16, 0.16), []);
  const plates: [number, THREE.Color][] = [
    [1.0, C.bronze],
    [0.0, C.silver],
    [-1.0, C.gold],
  ];
  const hues = useMemo(
    () =>
      Array.from({ length: N }, (_, i) =>
        new THREE.Color().setHSL(hash(i) * 0.9, 0.55, 0.62),
      ),
    [],
  );
  const fn: Fn = (i, t, o, c) => {
    const ph = (t / 7 + i / N) % 1;
    const y = 2.0 - ph * 3.2;
    // scattered → grid → merged groups
    const rx = (hash(i) - 0.5) * 3.2;
    const rz = (hash(i + 50) - 0.5) * 1.4;
    const gx = ((i % 9) - 4) * 0.3;
    const gz = ((Math.floor(i / 9) % 4) - 1.5) * 0.3;
    const mx = ((i % 3) - 1) * 0.6;
    const mz = 0;
    const a = ease((1.0 - y) / 0.5);
    const b = ease((0.0 - y) / 0.5);
    o.position.set(
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(rx, gx, a), mx, b),
      y,
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(rz, gz, a), mz, b),
    );
    o.rotation.set((1 - a) * t * 1.5 + i, (1 - a) * t + i, 0);
    o.scale.setScalar((1 + b * 1.4) * clamp01(ph * 8) * clamp01((1 - ph) * 8));
    c.copy(hues[i]).lerp(C.silver, a).lerp(C.gold, b);
  };
  return (
    <Stage y={-1.4}>
      {plates.map(([y, col], k) => (
        <mesh key={k} position={[0, y, 0]}>
          <boxGeometry args={[3.8, 0.02, 1.8]} />
          <meshBasicMaterial
            color={col}
            transparent
            opacity={0.16}
            toneMapped={false}
          />
        </mesh>
      ))}
      <Instances count={N} fn={fn} geometry={geo} />
    </Stage>
  );
}

/* ── CASE 03 · orchestration migration ───────────────────────────────────── */
// Legacy job plans (amber) lift off one by one and dock into the new platform's grid
// (cyan). Not one is dropped.
function Migration() {
  const cols = 8;
  const rows = 5;
  const N = cols * rows;
  const geo = useMemo(() => box(0.24, 0.24, 0.06), []);
  const frame = useMemo(() => box(0.26, 0.26, 0.02), []);
  const loop = 11;
  const at = (i: number, side: number, v: THREE.Vector3) =>
    v.set(
      side * 1.9 + ((i % cols) - (cols - 1) / 2) * 0.3,
      -0.55 + Math.floor(i / cols) * 0.3,
      0,
    );
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  const order = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => i).sort(
        (x, y) => hash(x + 7) - hash(y + 7),
      ),
    [N],
  );
  const rank = useMemo(() => {
    const r: number[] = [];
    order.forEach((idx, k) => (r[idx] = k));
    return r;
  }, [order]);
  const fn: Fn = (i, tt, o, c) => {
    const t = tt % loop;
    const p = ease((t - 0.6 - rank[i] * 0.2) / 0.9);
    const back = clamp01((t - 10.2) / 0.6);
    at(i, -1, a);
    at(i, 1, b);
    o.position.lerpVectors(a, b, p);
    o.position.y += Math.sin(Math.PI * p) * 0.9;
    o.position.z += Math.sin(Math.PI * p) * 0.6;
    o.rotation.y = p * Math.PI * 2;
    o.scale.setScalar(1 - back);
    c.copy(C.amber).lerp(C.cyan, p);
  };
  const frameFn: Fn = (i, _t, o, c) => {
    at(i, 1, o.position);
    o.position.z = -0.05;
    c.copy(C.dim);
  };
  return (
    <Stage>
      <Instances count={N} fn={frameFn} geometry={frame} />
      <Instances count={N} fn={fn} geometry={geo} />
    </Stage>
  );
}

export const SCENES = {
  dedup: Dedup,
  scd2: Scd2,
  salting: Salting,
  backfill: Backfill,
  telemetry: Telemetry,
  lakehouse: Lakehouse,
  migration: Migration,
} as const;
export type SceneName = keyof typeof SCENES;
