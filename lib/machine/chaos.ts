// The incident timeline. Everything that reacts to an injected fault (the 3D scene,
// the particle sim, the HUD metrics, the incident card) reads the same clock from here.

export type IncidentPhase = "inject" | "detect" | "diagnose" | "heal" | "recovered";

export const T = {
  detect: 2.2,
  diagnose: 4.6,
  heal: 7.0,
  recovered: 9.8,
  end: 14.5,
} as const;

export function phaseAt(s: number): IncidentPhase | null {
  if (s < 0 || s >= T.end) return null;
  if (s < T.detect) return "inject";
  if (s < T.diagnose) return "detect";
  if (s < T.heal) return "diagnose";
  if (s < T.recovered) return "heal";
  return "recovered";
}

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** How broken the machine is right now, 0..1: ramps in, holds, drains during the repair. */
export function faultAt(s: number) {
  if (s < 0 || s >= T.end) return 0;
  return smooth(s / 1.2) * (1 - smooth((s - T.heal - 0.4) / (T.recovered - T.heal - 0.4)));
}

/** Strength of the Sentinel's repair beam, 0..1. */
export function repairAt(s: number) {
  if (s < T.heal - 0.3 || s >= T.recovered + 0.8) return 0;
  return smooth((s - (T.heal - 0.3)) / 0.6) * (1 - smooth((s - T.recovered + 0.4) / 1.2));
}

/** The fault level and repair beam the sim workers need each frame. */
export type ChaosSignal = { id: string; fault: number; repair: number };
