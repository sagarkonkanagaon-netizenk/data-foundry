"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Stage } from "@/lib/content";
import type { Quality } from "./Scene";

// The 3D scene is its own chunk, fetched only after the page is interactive.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

function detect(): { ok: boolean; quality: Quality } {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { ok: false, quality: "low" };
  try {
    const c = document.createElement("canvas");
    if (!c.getContext("webgl2")) return { ok: false, quality: "low" };
  } catch {
    return { ok: false, quality: "low" };
  }
  const mobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
  return { ok: true, quality: mobile || weak ? "low" : "high" };
}

/**
 * Shows the server-rendered schematic (children) until the WebGL machine has drawn
 * its first frames, then cross-fades. Without WebGL or with reduced motion the
 * schematic simply stays.
 */
export function MachineLoader({ stages, children }: { stages: Stage[]; children: React.ReactNode }) {
  const [env, setEnv] = useState<{ ok: boolean; quality: Quality } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEnv(detect());
  }, []);

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 flex items-center justify-center px-6 pb-40 transition-opacity duration-[1800ms] ease-out md:px-12"
        style={{ opacity: ready ? 0 : 1 }}
        aria-hidden={ready}
      >
        <div className="w-full max-w-6xl">{children}</div>
      </div>
      {env?.ok && (
        <div className="absolute inset-0 transition-opacity duration-[2400ms] ease-out" style={{ opacity: ready ? 1 : 0 }}>
          <Scene stages={stages} quality={env.quality} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}
