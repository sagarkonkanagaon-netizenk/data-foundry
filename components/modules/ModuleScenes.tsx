"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SceneName } from "./scenes";
import { useRender } from "@/lib/gpu";

// three.js and the scenes load as their own chunk, only when WebGL is usable.
const ModulesCanvas = dynamic(() => import("./ModulesCanvas"), { ssr: false });
const SceneView = dynamic(() => import("./SceneView"), { ssr: false });

const Enabled = createContext(false);

// A one-line key in the corner of each scene, so the colours read without the write-up.
const LEGEND: Record<SceneName, [string, string][]> = {
  dedup: [["#9d8cff", "duplicate"], ["#f0b45a", "late"], ["#7fd8ff", "past the watermark"]],
  scd2: [["#7fd8ff", "current"], ["#9d8cff", "expired version"]],
  salting: [["#f0b45a", "hot key"], ["#7fd8ff", "salted"]],
  backfill: [["#7fd8ff", "day partition"], ["#d0645f", "failed run"]],
  telemetry: [["#7fd8ff", "reading"], ["#9d8cff", "new firmware schema"]],
  lakehouse: [["#c9a27a", "bronze"], ["#d6e4f0", "silver"], ["#f2c46d", "gold"]],
  migration: [["#f0b45a", "UC4 job"], ["#7fd8ff", "on DLS"]],
};


/** Wraps the modules list. Mounts the shared canvas only while the section is near the viewport. */
export function ModuleScenes({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, gpu, init } = useRender();
  const ok = ready && gpu;
  const [near, setNear] = useState(false);
  useEffect(() => {
    init();
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: "50% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [init]);
  return (
    <Enabled.Provider value={ok}>
      <div ref={ref}>{children}</div>
      {ok && near && <ModulesCanvas />}
    </Enabled.Provider>
  );
}

/** The glass vitrine where a module's data problem plays out in 3D: capsule header, or a large panel on its own page. */
export function CapsuleScene({ scene, label, large = false }: { scene: SceneName; label: string; large?: boolean }) {
  const ok = useContext(Enabled);
  if (!ok) return null;
  const frame = large
    ? "my-12 h-72 rounded-[28px] border md:h-96"
    : "-mx-7 -mt-7 mb-7 h-56 border-b md:-mx-8 md:-mt-8 md:mb-8";
  return (
    <div
      className={`relative overflow-hidden border-line bg-[radial-gradient(ellipse_at_50%_70%,rgba(127,216,255,0.07),transparent_70%)] ${frame}`}
      role="img"
      aria-label={label}
    >
      <ul aria-hidden className="absolute top-4 left-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] tracking-[0.18em] text-mute uppercase md:left-6">
        {LEGEND[scene].map(([color, text]) => (
          <li key={text} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {text}
          </li>
        ))}
      </ul>
      <SceneView scene={scene} />
    </div>
  );
}
