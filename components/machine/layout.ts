// World-space layout of the machine. Data flows along +x.
export const LAYOUT = {
  intake: { x: -8.6 },
  bronze: { x: -5.4, radius: 1.15, height: 3.4 },
  spark: { x: -1.9 },
  silver: { x: 1.6, radius: 1.15, height: 3.4 },
  quarantine: { x: 3.4, y: -2.55, z: 0.9, radius: 0.42 },
  gold: { x: 5.6, radius: 1.55 },
  dag: { y: 3.25, z: -0.6, x0: -6.4, x1: 6.4 },
} as const;

export const PALETTE = {
  void: "#05070d",
  cyan: "#7fd8ff",
  violet: "#9d8cff",
  amber: "#f0b45a",
  error: "#d0645f",
  gold: "#f2c46d",
  bronze: "#c9a27a",
  silver: "#d6e4f0",
  sentinel: "#e8f6ff",
} as const;
