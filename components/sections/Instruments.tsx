import type { Dial, Instruments as T } from "@/lib/content";
import { DraftTag, SectionHeader } from "@/components/ui";

// A 240° gauge. Needle = depth (1–5), readout = years. Deliberately not a progress bar.
function Gauge({ dial }: { dial: Dial }) {
  const start = 150; // degrees, measured clockwise from +x
  const sweep = 240;
  const r = 34;
  const pt = (deg: number, rad = r) => {
    const a = (deg * Math.PI) / 180;
    return [50 + Math.cos(a) * rad, 50 + Math.sin(a) * rad];
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = pt(from);
    const [x2, y2] = pt(to);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const needle = start + (sweep * dial.depth) / 5;
  const [nx, ny] = pt(needle, r - 8);
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 100 86" className="w-28" role="img" aria-label={`${dial.label}: depth ${dial.depth} of 5, ${dial.years} years`}>
        <path d={arc(start, start + sweep)} fill="none" stroke="#7fd8ff" strokeOpacity="0.12" strokeWidth="1" />
        <path d={arc(start, needle)} fill="none" stroke="#7fd8ff" strokeOpacity="0.8" strokeWidth="1.5" />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const [x1, y1] = pt(start + (sweep * i) / 5, r + 3);
          const [x2, y2] = pt(start + (sweep * i) / 5, r + 7);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7d8aa0" strokeOpacity={i <= dial.depth ? 0.9 : 0.3} />;
        })}
        <line x1="50" y1="50" x2={nx} y2={ny} stroke="#e8f6ff" strokeWidth="1" />
        <circle cx="50" cy="50" r="2" fill="#e8f6ff" />
        <text x="50" y="76" textAnchor="middle" fill="#d9e6f2" fontSize="11" fontFamily="var(--font-mono)">
          {String(dial.years).padStart(2, "0")}y
        </text>
      </svg>
      <figcaption className="mt-1 text-center font-mono text-[10px] tracking-[0.12em] text-mute uppercase">{dial.label}</figcaption>
    </figure>
  );
}

export function Instruments({ data }: { data: T & { file: string } }) {
  return (
    <section id="instruments" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader index="03" title={data.heading} intro={data.intro} draftFile={data.draft ? data.file : undefined} />
      <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {data.groups.map((g) => (
          <div key={g.name} className="bg-void p-6">
            <h3 className="mb-6 font-mono text-[11px] tracking-[0.25em] text-cyan/70 uppercase">{g.name}</h3>
            <div className="grid grid-cols-2 gap-y-6 xl:grid-cols-3">
              {g.dials.map((d) => (
                <Gauge key={d.label} dial={d} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
