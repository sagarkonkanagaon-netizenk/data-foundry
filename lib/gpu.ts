import { create } from "zustand";

// What this device can render, decided once per page load.
//   "static"  reduced motion or no WebGL: the still schematic
//   "flat"    phones, data saver, software-rendered GPUs: the 2.5D animated schematic
//   "low"     a real GPU on a modest machine: the 3D machine without post effects
//   "high"    the full 3D machine
// Phone visitors can switch to 3D anyway; that choice is remembered.

export type Tier = "static" | "flat" | "low" | "high";

const PREF = "df-3d";

type Detected = {
  tier: Tier;
  /** A hardware GPU that keeps up: the small module scenes run even where the machine is 2.5D. */
  gpu: boolean;
  canUpgrade: boolean;
  optedIn: boolean;
};

function softwareRenderer(gl: WebGL2RenderingContext) {
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
}

function readPref() {
  try {
    return localStorage.getItem(PREF) === "1";
  } catch {
    return false;
  }
}

function detect(): Detected {
  const none = { gpu: false, canUpgrade: false, optedIn: false };
  // ?render=3d | 2.5d | static forces a tier, for checking each version on one machine
  const forced = new URLSearchParams(location.search).get("render");
  if (forced === "3d") return { tier: "high", gpu: true, canUpgrade: false, optedIn: false };
  if (forced === "2.5d") return { tier: "flat", gpu: true, canUpgrade: false, optedIn: false };
  if (forced === "static") return { tier: "static", ...none };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { tier: "static", ...none };
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = document.createElement("canvas").getContext("webgl2");
  } catch {}
  if (!gl) return { tier: "static", ...none };
  const software = softwareRenderer(gl);
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  // CPU-rendered WebGL runs the 3D machine at a few frames a second and stalls the page
  if (software) return { tier: "flat", ...none };

  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  const phone = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  const saveData = !!nav.connection?.saveData;
  const optedIn = readPref();
  if ((phone || saveData) && !optedIn) return { tier: "flat", gpu: true, canUpgrade: true, optedIn: false };

  const weak = (navigator.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return { tier: phone || weak ? "low" : "high", gpu: true, canUpgrade: false, optedIn: phone || saveData };
}

type RenderState = Detected & {
  /** False until detected on the client; until then the still schematic shows. */
  ready: boolean;
  init: () => void;
  /** Phone visitor asked for the 3D machine. */
  upgrade: () => void;
  /** Phone visitor went back to 2.5D. */
  downgrade: () => void;
  /** The 3D machine couldn't hold a usable frame rate: step down to 2.5D for this visit. */
  demote: () => void;
};

export const useRender = create<RenderState>((set, get) => ({
  tier: "static",
  gpu: false,
  canUpgrade: false,
  optedIn: false,
  ready: false,
  init: () => {
    if (!get().ready) set({ ...detect(), ready: true });
  },
  upgrade: () => {
    try {
      localStorage.setItem(PREF, "1");
    } catch {}
    set({ tier: "low", canUpgrade: false, optedIn: true });
  },
  downgrade: () => {
    try {
      localStorage.removeItem(PREF);
    } catch {}
    set({ tier: "flat", canUpgrade: true, optedIn: false });
  },
  demote: () => set({ tier: "flat", gpu: false, canUpgrade: false }),
}));

export const is3d = (t: Tier) => t === "low" || t === "high";
