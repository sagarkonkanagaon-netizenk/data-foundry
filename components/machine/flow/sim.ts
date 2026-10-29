import * as THREE from "three";
import { LAYOUT, PALETTE } from "../layout";
import { COLUMNS, HOT, intakeCurve, latticePoints, live, quarantineCurve, RINGS, SPARK_YAW } from "../geometry";
import type { ChaosSignal } from "../../../lib/machine/chaos";

// The data-flow simulation. Every particle is a record making one trip through the
// machine; its position is a pure function of (record, time), so the sim needs no
// per-frame state and can later move into a Web Worker unchanged.

export const PERIOD = 18; // seconds for one record's full journey

// Life-fraction boundaries of each leg of the journey.
const LEG = {
  intake: [0, 0.12],
  bronze: [0.12, 0.3],
  toSpark: [0.3, 0.345],
  spark: [0.345, 0.53],
  toSilver: [0.53, 0.575],
  silver: [0.575, 0.79],
  toGold: [0.79, 0.835],
  gold: [0.835, 1],
} as const;
export type Leg = keyof typeof LEG;

export type FlowRecord = {
  id: number;
  source: number;
  offset: number;
  seed: [number, number, number, number];
  bad: boolean;
  ringA: number;
  nodeA: number;
  ringB: number;
  nodeB: number;
  slot: number;
  column: number;
  colT: number;
  colAng: number;
};

export type FlowBuffers = {
  position: Float32Array;
  color: Float32Array;
  alpha: Float32Array;
  jitter: Float32Array;
};

/** Seeded PRNG so a given record always carries the same payload and route. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRecords(count: number, badRate = 0.06): FlowRecord[] {
  const rnd = mulberry32(20201001);
  const lattice = latticePoints().length;
  return Array.from({ length: count }, (_, id) => {
    const ringA = Math.floor(rnd() * RINGS.length);
    let ringB = Math.floor(rnd() * RINGS.length);
    if (ringB === ringA) ringB = (ringB + 1) % RINGS.length; // a shuffle always crosses rings
    return {
      id,
      source: id % 4,
      offset: rnd(),
      seed: [rnd(), rnd(), rnd(), rnd()],
      bad: rnd() < badRate,
      ringA,
      nodeA: Math.floor(rnd() * RINGS[ringA].nodes),
      ringB,
      nodeB: Math.floor(rnd() * RINGS[ringB].nodes),
      slot: Math.floor(rnd() * lattice),
      column: Math.floor(rnd() * COLUMNS.length),
      colT: 0.25 + rnd() * 0.7,
      colAng: rnd() * Math.PI * 2,
    };
  });
}

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const local = (life: number, leg: Leg) => clamp01((life - LEG[leg][0]) / (LEG[leg][1] - LEG[leg][0]));

export function legOf(life: number): Leg {
  for (const k of Object.keys(LEG) as Leg[]) if (life < LEG[k][1]) return k;
  return "gold";
}

export function createFlow(sourceColors: string[]) {
  const curves = [0, 1, 2, 3].map(intakeCurve);
  const quarantine = quarantineCurve();
  const lattice = latticePoints();
  const ringMats = RINGS.map((r) => new THREE.Matrix4().makeRotationY(SPARK_YAW).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...r.tilt))));
  const columnMats = COLUMNS.map((c) =>
    new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(c.a) * c.d, -0.75, Math.sin(c.a) * c.d),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(c.a) * c.d * 0.3, 0, -Math.cos(c.a) * c.d * 0.3)),
      new THREE.Vector3(c.r, c.h, c.r),
    ),
  );

  const srcCol = sourceColors.map((c) => new THREE.Color(c));
  const C = {
    violet: new THREE.Color("#cfc6ff"),
    silver: new THREE.Color(PALETTE.silver),
    gold: new THREE.Color("#ffd27a"),
    error: new THREE.Color("#ff5a52"),
    amber: new THREE.Color(PALETTE.amber),
    repair: new THREE.Color("#bfefff"),
  };

  const B = LAYOUT.bronze;
  const S = LAYOUT.silver;
  const G = LAYOUT.gold;
  const bronzeExit = new THREE.Vector3(B.x + B.radius, 0, 0);
  const sparkIn = new THREE.Vector3(LAYOUT.spark.x - 0.3, 0, 0);
  const sparkOut = new THREE.Vector3(LAYOUT.spark.x + 0.3, 0, 0);
  const sparkPos = new THREE.Vector3(LAYOUT.spark.x, 0, 0);
  const silverIn = new THREE.Vector3(S.x - S.radius, 0, 0);
  const silverOut = new THREE.Vector3(S.x + S.radius, 0, 0);
  const goldIn = new THREE.Vector3(G.x - G.radius, 0, 0);
  const pod = new THREE.Vector3(LAYOUT.quarantine.x, LAYOUT.quarantine.y, LAYOUT.quarantine.z);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const bow = new THREE.Vector3();
  const h = new THREE.Vector3();
  const q = new THREE.Vector3();
  const col = new THREE.Color();
  const yAxis = new THREE.Vector3(0, 1, 0);

  const node = (ring: number, n: number, out: THREE.Vector3) => {
    const R = RINGS[ring];
    const phi = (n / R.nodes) * Math.PI * 2 + live.sparkSpin[ring];
    return out.set(0, Math.cos(phi) * R.r, Math.sin(phi) * R.r).applyMatrix4(ringMats[ring]).add(sparkPos);
  };

  const bronzeWander = (r: FlowRecord, time: number, out: THREE.Vector3) => {
    const [s0, s1, s2, s3] = r.seed;
    const theta = s0 * Math.PI * 2 + time * 0.5 * (s1 - 0.5);
    const rho = (0.2 + 0.62 * Math.sqrt(s2)) * B.radius;
    const y = (s3 - 0.5) * B.height * 0.78 + Math.sin(time * 0.7 + s0 * 20) * 0.18;
    return out.set(B.x + Math.cos(theta) * rho, y, Math.sin(theta) * rho);
  };

  const columnPoint = (r: FlowRecord, out: THREE.Vector3) => {
    out.set(Math.cos(r.colAng) * 1.04, r.colT, Math.sin(r.colAng) * 1.04).applyMatrix4(columnMats[r.column]);
    out.applyAxisAngle(yAxis, live.goldRot);
    return out.add(c.set(G.x, live.goldY, 0));
  };

  function sparkPath(ra: number, na: number, rb: number, nb: number, t: number, out: THREE.Vector3) {
    node(ra, na, a);
    node(rb, nb, b);
    if (t < 0.28) return out.lerpVectors(sparkIn, a, ease(t / 0.28));
    if (t < 0.72) {
      // the shuffle: an arc that bows out away from the axle
      const u = ease((t - 0.28) / 0.44);
      c.addVectors(a, b).multiplyScalar(0.5);
      c.add(bow.copy(c).sub(sparkPos).normalize().multiplyScalar(1.1));
      return out.copy(a).multiplyScalar((1 - u) * (1 - u)).addScaledVector(c, 2 * u * (1 - u)).addScaledVector(b, u * u);
    }
    return out.lerpVectors(b, sparkOut, ease((t - 0.72) / 0.28));
  }

  /** Quarantined: diverted at Silver's door, parked in the pod, then expired. Returns alpha. */
  function quarantinePath(r: FlowRecord, life: number, time: number, out: THREE.Vector3) {
    const t = clamp01((life - LEG.silver[0]) / (1 - LEG.silver[0]));
    if (t < 0.12) out.lerpVectors(silverIn, quarantine.points[0], ease(t / 0.12));
    else if (t < 0.4) quarantine.getPoint(ease((t - 0.12) / 0.28), out);
    else {
      const o = r.seed[2] * Math.PI * 2 + time * 0.8;
      out.copy(pod).add(q.set(Math.cos(o) * 0.22 * r.seed[3], Math.sin(o * 1.3) * 0.18, Math.sin(o) * 0.22 * r.seed[3]));
    }
    return 1 - clamp01((t - 0.85) / 0.15);
  }

  /**
   * Bends a record's normal path toward its broken path while an incident is live.
   * `fault` blends the failure in and out; `repair` tints records in the Sentinel's beam.
   */
  function applyChaos(r: FlowRecord, life: number, leg: Leg, time: number, p: THREE.Vector3, s: { alpha: number; jitter: number }, chaos: ChaosSignal) {
    const f = chaos.fault;
    let hit = false;
    switch (chaos.id) {
      case "schema-drift":
        // orders.v3 gains a column: orders back up in Bronze until the schema evolves
        if (r.source !== 0) break;
        if (leg === "bronze") {
          hit = true;
          s.jitter *= 1 + 2.5 * f;
          col.lerp(C.amber, f);
        } else if (leg === "toSpark" || leg === "spark" || leg === "toSilver") {
          hit = true;
          p.lerp(bronzeWander(r, time, h), f);
          col.lerp(C.amber, f);
          s.jitter = Math.max(s.jitter, f);
        }
        break;
      case "late-data":
        // a site gateway goes quiet, then flushes everything at once
        if (r.source !== 1 || (leg !== "intake" && leg !== "bronze")) break;
        hit = true;
        h.copy(curves[1].v0).add(q.set(0.15 + r.seed[0] * 0.35, (r.seed[1] - 0.5) * 0.2, (r.seed[2] - 0.5) * 0.2));
        p.lerp(h, f);
        col.lerp(C.amber, f * 0.8);
        break;
      case "null-storm":
        // a third of transactions arrive with null amounts and flood quarantine
        if (r.source !== 2 || r.bad || r.seed[3] > 0.55) break;
        if (leg === "bronze") {
          hit = true;
          if (Math.sin(time * 23 + r.seed[1] * 40) > 0.2) col.lerp(C.error, f);
        } else if (leg === "silver" || leg === "toGold" || leg === "gold") {
          hit = true;
          const qa = quarantinePath(r, life, time, h);
          p.lerp(h, f);
          s.alpha = s.alpha + (qa - s.alpha) * f;
          col.lerp(C.error, f);
        }
        break;
      case "skewed-partition":
        // one hot key: most records pile onto a single executor
        if (leg !== "spark" || r.seed[2] > 0.72) break;
        hit = true;
        sparkPath(HOT.ring, HOT.node, r.ringB, r.nodeB, local(life, "spark"), h);
        p.lerp(h, f);
        col.lerp(C.amber, f * 0.7);
        break;
      case "source-outage":
        // the supply-chain feed goes silent
        if (r.source !== 3 || (leg !== "intake" && leg !== "bronze")) break;
        hit = true;
        s.alpha *= 1 - f;
        break;
    }
    if (hit && chaos.repair > 0) col.lerp(C.repair, chaos.repair * 0.75);
  }

  /** Where record `r` is at `time`, plus its colour, opacity and jitter. */
  function sample(r: FlowRecord, time: number, p: THREE.Vector3, chaos: ChaosSignal | null = null) {
    const life = (time / PERIOD + r.offset) % 1;
    const leg = legOf(life);
    let alpha = 1;
    let jitter = 0;
    col.copy(srcCol[r.source]);

    switch (leg) {
      case "intake": {
        const t = local(life, "intake");
        curves[r.source].getPoint(t, p);
        // spread across the tube so streams read as ribbons, not single files
        const ang = r.seed[0] * Math.PI * 2;
        p.y += Math.cos(ang) * 0.04;
        p.z += Math.sin(ang) * 0.04;
        alpha = clamp01(t * 6);
        break;
      }
      case "bronze": {
        const t = local(life, "bronze");
        bronzeWander(r, time, a);
        if (t < 0.2) p.lerpVectors(curves[r.source].v3, a, ease(t / 0.2));
        else if (t > 0.85) p.lerpVectors(a, bronzeExit, ease((t - 0.85) / 0.15));
        else p.copy(a);
        jitter = Math.sin(Math.PI * t);
        if (r.bad && Math.sin(time * 23 + r.seed[1] * 40) > 0.2) col.copy(C.error);
        break;
      }
      case "toSpark":
        p.lerpVectors(bronzeExit, sparkIn, local(life, "toSpark"));
        break;
      case "spark":
        sparkPath(r.ringA, r.nodeA, r.ringB, r.nodeB, local(life, "spark"), p);
        col.lerp(C.violet, 0.65);
        break;
      case "toSilver":
        p.lerpVectors(sparkOut, silverIn, local(life, "toSilver"));
        col.lerp(C.silver, 0.5);
        break;
      default: {
        if (r.bad) {
          alpha = quarantinePath(r, life, time, p);
          col.copy(C.error);
          break;
        }
        if (leg === "silver") {
          const t = local(life, "silver");
          a.copy(lattice[r.slot]).applyAxisAngle(yAxis, live.latticeRot).add(b.set(S.x, 0, 0));
          if (t < 0.3) p.lerpVectors(silverIn, a, ease(t / 0.3));
          else if (t > 0.82) p.lerpVectors(a, silverOut, ease((t - 0.82) / 0.18));
          else p.copy(a);
          col.copy(C.silver);
        } else if (leg === "toGold") {
          p.lerpVectors(silverOut, goldIn, local(life, "toGold"));
          col.copy(C.silver).lerp(C.gold, local(life, "toGold"));
        } else {
          const t = local(life, "gold");
          columnPoint(r, a);
          if (t < 0.45) p.lerpVectors(goldIn, a, ease(t / 0.45));
          else p.copy(a);
          col.copy(C.gold);
          alpha = 1 - clamp01((t - 0.55) / 0.45);
        }
      }
    }
    const s = { alpha, jitter };
    if (chaos && (chaos.fault > 0.001 || chaos.repair > 0.001)) applyChaos(r, life, leg, time, p, s, chaos);
    return { leg, alpha: s.alpha, jitter: s.jitter, color: col };
  }

  const p = new THREE.Vector3();
  function step(records: FlowRecord[], time: number, out: FlowBuffers, chaos: ChaosSignal | null = null) {
    for (let i = 0; i < records.length; i++) {
      const s = sample(records[i], time, p, chaos);
      out.position[i * 3] = p.x;
      out.position[i * 3 + 1] = p.y;
      out.position[i * 3 + 2] = p.z;
      out.color[i * 3] = s.color.r;
      out.color[i * 3 + 1] = s.color.g;
      out.color[i * 3 + 2] = s.color.b;
      out.alpha[i] = s.alpha;
      out.jitter[i] = s.jitter;
    }
  }

  return { step, legAt: (r: FlowRecord, time: number) => legOf((time / PERIOD + r.offset) % 1) };
}
