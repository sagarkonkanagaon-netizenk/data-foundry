// Scroll-driven camera tour. The page writes `tour.u` (0 = hero, k = tour block k
// centred in the viewport); the camera rig reads it every frame.

export const tour = { u: 0 };

export type Shot = { pos: [number, number, number]; look: [number, number, number] };

/** Block order after the hero: an intro, then one block per stage file, in order. */
export const TOUR_STAGES = ["intake", "bronze", "spark", "silver", "gold", "orchestrator", "sentinel"] as const;

// World-space camera shots. The machine group sits at x + 0.4. Shots frame each
// chamber off-centre so the caption card has the other half of the screen.
export const SHOTS: Record<string, Shot> = {
  intro: { pos: [-4.5, 4.2, 19], look: [0.4, -0.6, 0] },
  intake: { pos: [-12.2, 1.4, 7.4], look: [-7.4, -0.1, 0] },
  bronze: { pos: [-8.2, 1.5, 7.2], look: [-3.9, 0, 0] },
  spark: { pos: [2.2, 1.3, 8.0], look: [-2.5, 0, 0] },
  silver: { pos: [-1.1, 1.4, 7.4], look: [3.3, -0.4, 0] },
  gold: { pos: [9.6, 1.6, 6.6], look: [5.0, 0, 0] },
  // down the length of the DAG from its last task, so the run reads as a receding line
  orchestrator: { pos: [10.4, 5.0, 7.4], look: [0.8, 2.8, -0.6] },
  sentinel: { pos: [-3.5, 3.4, 12.5], look: [1.6, 1.4, 0] },
};

/** Which side of the screen each stage's caption sits on (the chamber takes the other). */
export const CAPTION_SIDE: Record<string, "left" | "right"> = {
  intake: "right",
  bronze: "right",
  spark: "left",
  silver: "right",
  gold: "left",
  orchestrator: "left",
  sentinel: "right",
};
