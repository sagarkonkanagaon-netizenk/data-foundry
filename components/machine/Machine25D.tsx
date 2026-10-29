"use client";

import { useEffect, useRef } from "react";
import type { Stage } from "@/lib/content";
import { CAPTION_SIDE, TOUR_STAGES, tour } from "@/lib/machine/tour";
import { useMachine } from "@/lib/machine/store";
import type { StageId } from "@/lib/machine/types";
import { CY, H, STAGE_AT, Schematic, W } from "@/components/Schematic";
import { flyTo } from "@/components/Tour";

// The machine for phones and GPU-less machines: the schematic split into depth layers
// and stacked in CSS 3D, with records flowing through it, a camera that flies the same
// tour as the 3D version, and the Sentinel reacting to injected chaos. No WebGL, a
// few dozen SVG nodes, and the compositor does the rest.

type Focus = { x: number; y: number; zoom: number; side: number };

// phones get the machine a little larger, since it has the width of the screen to itself
const HERO = (wide: boolean): Focus => ({ x: W / 2, y: H / 2, zoom: wide ? 1 : 1.3, side: 0 });
const INTRO = (wide: boolean): Focus => ({ x: W / 2, y: H / 2 - 10, zoom: wide ? 1.08 : 1.4, side: 0 });
const FOCUS_Y: Record<string, number> = { orchestrator: 90, sentinel: 190 };

function stageFocus(id: string, wide: boolean): Focus {
  const [x, y] = STAGE_AT[id];
  return { x, y: FOCUS_Y[id] ?? y, zoom: wide ? 1.9 : 2.3, side: wide ? (CAPTION_SIDE[id] === "right" ? -0.2 : 0.2) : 0 };
}

const LAYERS = { back: -90, flow: -30, mid: 0, front: 80 } as const;
const PERSPECTIVE = 1100;
// each slice is scaled against its depth so the stack lines up exactly when seen head-on
const depth = (z: number) => `translateZ(${z}px) scale(${((PERSPECTIVE - z) / PERSPECTIVE).toFixed(4)})`;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Records riding the conduits: source colour, then bronze, silver and gold. Every sixth fails a check and drops to quarantine. */
function Records({ colors }: { colors: string[] }) {
  const n = 22;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const lane = i % Math.max(colors.length, 1);
        const y = CY - 75 + lane * 50;
        const bad = i % 6 === 5;
        const path = bad
          ? `M 20 ${y} C 120 ${y}, 140 ${CY}, 230 ${CY} L 680 ${CY} C 700 ${CY + 140}, 740 ${CY + 150}, 785 ${CY + 165}`
          : `M 20 ${y} C 120 ${y}, 140 ${CY}, 230 ${CY} L 1000 ${CY}`;
        const dur = 7 + ((i * 37) % 5);
        const begin = -((i * 1.37) % dur);
        const jitter = ((i * 53) % 40) - 20;
        return (
          <g key={i} transform={`translate(0 ${bad ? 0 : jitter})`}>
            <circle r={bad ? 3 : 2.4} fill={colors[lane] ?? "#7fd8ff"}>
              <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} />
              <animate
                attributeName="fill"
                dur={`${dur}s`}
                begin={`${begin}s`}
                repeatCount="indefinite"
                values={bad ? `${colors[lane]};#c9a27a;#d0645f;#d0645f` : `${colors[lane]};#c9a27a;#9d8cff;#d6e4f0;#f2c46d`}
                keyTimes={bad ? "0;0.25;0.6;1" : "0;0.25;0.45;0.65;1"}
              />
              <animate attributeName="opacity" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.05;0.9;1" />
            </circle>
          </g>
        );
      })}
    </g>
  );
}

/** Running-task halos, the incident ring and the Sentinel's repair beam. */
function Signals() {
  const active = useMachine((s) => s.activeStages);
  const incident = useMachine((s) => s.incident);
  const phase = useMachine((s) => s.phase);
  const at = incident ? STAGE_AT[incident.stage] : null;
  const healing = phase === "heal" || phase === "recovered";
  const tone = healing ? "#7fd8ff" : incident?.severity === "error" ? "#d0645f" : "#f0b45a";
  return (
    <g>
      {Object.entries(STAGE_AT).map(([id, [x, y]]) => (
        <circle key={id} cx={x} cy={y} r="70" fill="#7fd8ff" opacity={active.has(id as StageId) ? 0.07 : 0} style={{ transition: "opacity 0.8s" }} />
      ))}
      {at && (
        <g>
          <circle cx={at[0]} cy={at[1]} r="60" fill={tone} opacity="0.12" style={{ transition: "fill 0.6s" }} />
          <circle cx={at[0]} cy={at[1]} r="36" fill="none" stroke={tone} strokeWidth="1.5" className="ping-ring" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          {phase !== "inject" && (
            <line x1={STAGE_AT.sentinel[0]} y1={STAGE_AT.sentinel[1]} x2={at[0]} y2={at[1]} stroke={healing ? "#7fd8ff" : "#e8f6ff"} strokeOpacity={healing ? 0.9 : 0.35} strokeWidth={healing ? 2 : 1} className="flow" />
          )}
        </g>
      )}
    </g>
  );
}

/** Invisible click targets over each chamber, mirroring the 3D hitboxes. Keyboard users have the tour captions. */
function Hits() {
  const boxes: [string, number, number, number, number][] = [
    ["intake", 10, CY - 100, 210, 200],
    ["bronze", 225, CY - 105, 150, 210],
    ["spark", 420, CY - 120, 100, 240],
    ["silver", 565, CY - 105, 160, 210],
    ["gold", 875, CY - 105, 170, 200],
    ["orchestrator", 230, 45, 780, 55],
    ["sentinel", 605, 110, 70, 70],
  ];
  return (
    <g aria-hidden>
      {boxes.map(([id, x, y, w, h]) => (
        <rect key={id} x={x} y={y} width={w} height={h} fill="transparent" className="cursor-pointer" style={{ pointerEvents: "all" }} onClick={() => flyTo(id)} />
      ))}
    </g>
  );
}

export function Machine25D({ stages, paused }: { stages: Stage[]; paused: boolean }) {
  const rig = useRef<HTMLDivElement>(null);
  const colors = (stages.find((s) => s.id === "intake")?.sources ?? []).map((s) => s.color);

  useEffect(() => {
    const el = rig.current;
    if (!el || paused) return;
    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const cur = { x: W / 2, y: H / 2, zoom: window.innerWidth >= 768 ? 1 : 1.3, side: 0, rx: 18, ry: -12 };
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const wide = window.innerWidth >= 768;
      const shots = [HERO(wide), INTRO(wide), ...TOUR_STAGES.map((s) => stageFocus(s, wide))];
      const u = Math.min(shots.length - 1, Math.max(0, tour.u));
      const i = Math.min(Math.floor(u), shots.length - 2);
      const f = smooth(0.15, 0.85, u - i);
      const a = shots[i];
      const b = shots[i + 1];
      const want = {
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        zoom: a.zoom + (b.zoom - a.zoom) * f,
        side: a.side + (b.side - a.side) * f,
        // a three-quarter tilt at the top that settles as the tour moves in close
        rx: (u < 1 ? 18 - 6 * u : 12) + Math.sin(t * 0.07) * 1.5 + pointer.y * 4,
        ry: (u < 1 ? -12 + 6 * u : -6) + Math.sin(t * 0.05) * 3 + pointer.x * 7,
      };
      const k = 1 - Math.exp(-dt * 2.4);
      for (const key of Object.keys(cur) as (keyof typeof cur)[]) cur[key] += (want[key] - cur[key]) * k;
      const s = el.offsetWidth / W;
      const tx = -(cur.x - W / 2) * s * cur.zoom + cur.side * window.innerWidth;
      const ty = -(cur.y - H / 2) * s * cur.zoom - (wide ? 0 : u >= 1 ? window.innerHeight * 0.14 : 0);
      el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg) scale(${cur.zoom.toFixed(3)})`;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [paused]);

  const layer = (z: number, extra = "") => ({ className: `absolute inset-0 ${extra}`, style: { transform: depth(z) } });

  return (
    <div className="absolute inset-0 flex items-start justify-center px-6 pt-[11rem] sm:items-center sm:pt-0 sm:pb-40 md:px-12" style={{ perspective: `${PERSPECTIVE}px` }} role="img" aria-label="The Data Foundry machine: records flow from sources through Bronze, Spark and Silver into Gold, watched by the Sentinel.">
      {/* floor grid, receding under the machine */}
      <div
        aria-hidden
        className="absolute inset-x-[-50%] top-[58%] h-[120%] opacity-60"
        style={{
          transform: "rotateX(78deg)",
          transformOrigin: "top",
          backgroundImage:
            "linear-gradient(rgb(127 216 255 / 0.09) 1px, transparent 1px), linear-gradient(90deg, rgb(127 216 255 / 0.09) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 50% 45% at 50% 10%, #000 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 50% 45% at 50% 10%, #000 20%, transparent 75%)",
        }}
      />
      <div ref={rig} className="relative w-full max-w-6xl will-change-transform" style={{ transformStyle: "preserve-3d", transform: "rotateX(18deg) rotateY(-12deg)" }}>
        <div className="pointer-events-none" style={{ transform: depth(LAYERS.back) }}>
          <Schematic stages={stages} layer="back" />
        </div>
        <div {...layer(LAYERS.flow, "pointer-events-none")}>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-hidden>
            <Signals />
            <Records colors={colors} />
          </svg>
        </div>
        <div {...layer(LAYERS.mid, "pointer-events-none")}>
          <Schematic stages={stages} layer="mid" />
        </div>
        <div {...layer(LAYERS.front, "pointer-events-none")}>
          <Schematic stages={stages} layer="front">
            <Hits />
          </Schematic>
        </div>
      </div>
    </div>
  );
}
