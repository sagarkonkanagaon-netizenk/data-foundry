import type { Stage } from "@/lib/content";

// A blueprint-style side elevation of the machine. It is the poster frame the 3D scene
// loads over, and the permanent fallback for no-WebGL and reduced-motion visitors.

const W = 1200;
const H = 520;
const CY = 300;

export function Schematic({ stages }: { stages: Stage[] }) {
  const by = Object.fromEntries(stages.map((s) => [s.id, s]));
  const sources = by.intake?.sources ?? [];
  const tasks = by.orchestrator?.tasks ?? [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="schem-title schem-desc" className="h-auto w-full">
      <title id="schem-title">The Data Foundry machine</title>
      <desc id="schem-desc">
        Raw sources flow into a Bronze chamber, through a Spark core of executor rings, into a Silver chamber with a
        quarantine pod, and settle as a Gold crystal. An orchestrator DAG floats above; a sentinel orb watches.
      </desc>
      <defs>
        <linearGradient id="glass" x1="0" x2="1">
          <stop offset="0" stopColor="#7fd8ff" stopOpacity="0.02" />
          <stop offset="0.5" stopColor="#7fd8ff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#7fd8ff" stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id="orb">
          <stop offset="0" stopColor="#e8f6ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#7fd8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="goldGlow">
          <stop offset="0" stopColor="#f2c46d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f2c46d" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* spine */}
      <line x1="150" y1={CY} x2="1080" y2={CY} stroke="#7fd8ff" strokeOpacity="0.12" />

      {/* intake ribbons */}
      {sources.map((s, i) => {
        const y = CY - 75 + i * 50;
        return (
          <g key={s.id}>
            <path
              d={`M 20 ${y} C 120 ${y}, 140 ${CY}, 230 ${CY}`}
              fill="none"
              stroke={s.color}
              strokeOpacity="0.7"
              strokeWidth="1.5"
              className="flow"
            />
            <text x="20" y={y - 8} fill={s.color} fillOpacity="0.8" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="1.5">
              {s.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* bronze: frosted cylinder */}
      <Chamber x={230} w={140} h={190} label="BRONZE" tint="#c9a27a" opacity={0.1} />
      {[...Array(14)].map((_, i) => (
        <circle
          key={i}
          cx={250 + ((i * 61 + 17) % 100)}
          cy={CY - 70 + ((i * i * 29 + i * 7) % 140)}
          r="2"
          fill={i % 5 === 0 ? "#d0645f" : "#c9a27a"}
          opacity={i % 5 === 0 ? 0.9 : 0.6}
          className={i % 5 === 0 ? "breathe" : undefined}
        />
      ))}

      {/* spark core: executor rings */}
      <g>
        {[70, 52, 34].map((r, i) => (
          <ellipse key={r} cx="470" cy={CY} rx={r * 0.42} ry={r * 1.25} fill="none" stroke="#9d8cff" strokeOpacity={0.35 + i * 0.15} />
        ))}
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={470 + Math.cos(a) * 29} cy={CY + Math.sin(a) * 87} r="3" fill="#9d8cff" />;
        })}
        <path d={`M 440 ${CY - 60} Q 470 ${CY - 140} 500 ${CY - 40}`} fill="none" stroke="#9d8cff" strokeOpacity="0.5" className="flow" />
        <path d={`M 445 ${CY + 50} Q 470 ${CY + 130} 498 ${CY + 30}`} fill="none" stroke="#9d8cff" strokeOpacity="0.5" className="flow" />
        <Label x={470} y={CY + 130} text="SPARK CORE" />
      </g>
      <line x1="370" y1={CY} x2="560" y2={CY} stroke="#9d8cff" strokeOpacity="0.5" className="flow" />

      {/* silver: clear cylinder with lattice + quarantine pod */}
      <Chamber x={570} w={150} h={190} label="SILVER" tint="#d6e4f0" opacity={0.05} />
      {[...Array(5)].map((_, r) =>
        [...Array(5)].map((_, c) => (
          <rect key={`${r}-${c}`} x={595 + c * 24} y={CY - 58 + r * 24} width="3" height="3" fill="#d6e4f0" opacity="0.75" />
        )),
      )}
      <path d={`M 690 ${CY + 95} C 700 ${CY + 140}, 740 ${CY + 150}, 760 ${CY + 160}`} fill="none" stroke="#d0645f" strokeOpacity="0.6" className="flow" />
      <circle cx="785" cy={CY + 165} r="22" fill="none" stroke="#d0645f" strokeOpacity="0.55" />
      <circle cx="785" cy={CY + 165} r="3" fill="#d0645f" className="breathe" />
      <Label x={785} y={CY + 205} text="QUARANTINE" color="#d0645f" />
      <line x1="720" y1={CY} x2="880" y2={CY} stroke="#d6e4f0" strokeOpacity="0.4" className="flow" />

      {/* gold: crystal */}
      <circle cx="960" cy={CY} r="120" fill="url(#goldGlow)" />
      <polygon
        points={`960,${CY - 95} 1035,${CY - 30} 1010,${CY + 85} 910,${CY + 85} 885,${CY - 30}`}
        fill="#f2c46d"
        fillOpacity="0.06"
        stroke="#f2c46d"
        strokeOpacity="0.8"
      />
      <polyline points={`960,${CY - 95} 960,${CY + 10} 1010,${CY + 85}`} fill="none" stroke="#f2c46d" strokeOpacity="0.4" />
      <polyline points={`885,${CY - 30} 960,${CY + 10} 1035,${CY - 30}`} fill="none" stroke="#f2c46d" strokeOpacity="0.4" />
      <line x1="960" y1={CY + 10} x2="910" y2={CY + 85} stroke="#f2c46d" strokeOpacity="0.4" />
      <Label x={960} y={CY + 130} text="GOLD" color="#f2c46d" />

      {/* orchestrator DAG */}
      <g>
        {tasks.map((t, i) => {
          const x = 260 + i * (720 / Math.max(tasks.length - 1, 1));
          return (
            <g key={t}>
              {i > 0 && <line x1={x - 720 / (tasks.length - 1) + 6} y1="62" x2={x - 6} y2="62" stroke="#7fd8ff" strokeOpacity="0.3" />}
              <rect x={x - 5} y="57" width="10" height="10" fill="none" stroke="#7fd8ff" strokeOpacity={i < 3 ? 0.9 : 0.35} />
              {i < 3 && <rect x={x - 2} y="60" width="4" height="4" fill="#7fd8ff" />}
              <text x={x} y="88" textAnchor="middle" fill="#7d8aa0" fontSize="9" fontFamily="var(--font-mono)">
                {t}
              </text>
            </g>
          );
        })}
        <Label x={160} y={66} text="DAG" anchor="start" />
      </g>

      {/* sentinel orb + scan cone */}
      <g className="breathe">
        <path d={`M 640 140 L 590 ${CY - 100} L 700 ${CY - 100} Z`} fill="#e8f6ff" fillOpacity="0.05" />
        <circle cx="640" cy="140" r="26" fill="url(#orb)" />
        <circle cx="640" cy="140" r="5" fill="#e8f6ff" />
      </g>
      <Label x={672} y={136} text="SENTINEL" anchor="start" color="#e8f6ff" />
    </svg>
  );
}

function Chamber({ x, w, h, label, tint, opacity }: { x: number; w: number; h: number; label: string; tint: string; opacity: number }) {
  const top = CY - h / 2;
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} rx="8" fill={tint} fillOpacity={opacity} />
      <rect x={x} y={top} width={w} height={h} rx="8" fill="url(#glass)" stroke={tint} strokeOpacity="0.55" />
      <ellipse cx={x + w / 2} cy={top} rx={w / 2} ry="9" fill="none" stroke={tint} strokeOpacity="0.5" />
      <ellipse cx={x + w / 2} cy={top + h} rx={w / 2} ry="9" fill="none" stroke={tint} strokeOpacity="0.3" />
      <Label x={x + w / 2} y={top + h + 40} text={label} color={tint} />
    </g>
  );
}

function Label({ x, y, text, color = "#7d8aa0", anchor = "middle" }: { x: number; y: number; text: string; color?: string; anchor?: "start" | "middle" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fillOpacity="0.85" fontSize="10" letterSpacing="2.5" fontFamily="var(--font-mono)">
      {text}
    </text>
  );
}
