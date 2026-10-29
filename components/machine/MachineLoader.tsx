"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Stage } from "@/lib/content";
import { is3d, useRender } from "@/lib/gpu";
import { Machine25D } from "./Machine25D";

// The 3D scene is its own chunk, fetched only on devices that will render it.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/** Resolves once the browser is idle after load, so the 3D chunk never competes with first paint. */
function whenIdle(fn: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout: 1500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = setTimeout(fn, 300);
  return () => clearTimeout(id);
}

/**
 * Shows the server-rendered schematic (children) until the machine for this device is
 * ready, then cross-fades: the 3D machine on desktops with a real GPU, the 2.5D one on
 * phones and software renderers. With reduced motion or no WebGL the schematic stays.
 */
export function MachineLoader({ stages, children }: { stages: Stage[]; children: React.ReactNode }) {
  const { tier, ready: detected, init, demote } = useRender();
  const [idle, setIdle] = useState(false);
  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    const cancel = whenIdle(() => setIdle(true));
    // stop animating the machine once it has scrolled out of view
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    if (root.current) io.observe(root.current);
    return () => {
      cancel();
      io.disconnect();
    };
  }, [init]);

  const three = detected && idle && is3d(tier);
  const flat = detected && tier === "flat";
  // the 3D scene reports ready after its first frames; the 2.5D one is ready at once
  const shown = flat || (three && ready);

  return (
    <div ref={root} className="absolute inset-0">
      <div className="absolute inset-0 flex items-start justify-center px-6 pt-[11rem] transition-opacity duration-[1800ms] sm:items-center sm:pt-0 sm:pb-40 ease-out md:px-12" style={{ opacity: shown ? 0 : 1 }} aria-hidden={shown}>
        <div className="w-full max-w-6xl">{children}</div>
      </div>
      {flat && (
        <div className="absolute inset-0 animate-[fade-in_1.2s_ease-out]">
          <Machine25D stages={stages} paused={!onScreen} />
        </div>
      )}
      {three && (
        <div className="absolute inset-0 transition-opacity duration-[2400ms] ease-out" style={{ opacity: ready ? 1 : 0 }} role="img" aria-label="The Data Foundry machine, rendered in 3D. The tour captions below describe each chamber.">
          <Scene stages={stages} quality={tier === "high" ? "high" : "low"} paused={!onScreen} onReady={() => setReady(true)} onSlow={demote} />
        </div>
      )}
    </div>
  );
}
