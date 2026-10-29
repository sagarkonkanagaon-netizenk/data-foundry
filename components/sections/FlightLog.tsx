import type { FlightLog as T } from "@/lib/content";
import { SectionHeader } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

// "2024-11" → "2024-11-01T09:30:00+05:30": a log timestamp, IST, first working morning.
const stamp = (ym: string) => (ym === "present" ? null : `${ym}-01T09:30:00+05:30`);

export function FlightLog({ data }: { data: T & { file: string } }) {
  return (
    <section id="flight-log" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader index="05" title={data.heading} intro={data.intro} draftFile={data.draft ? data.file : undefined} />
      <div className="font-mono text-[13px] md:ml-[204px]">
        <div className="mb-10 text-[11px] tracking-[0.12em] text-mute">
          <span className="text-cyan/70">$</span> tail -f /var/log/foundry/flight.log
        </div>
        <ol className="relative border-l border-line">
          {data.entries.map((e, i) => {
            const from = stamp(e.start);
            const to = stamp(e.end);
            const live = e.end === "present";
            return (
              <Reveal as="li" key={e.company} className="relative pb-16 pl-8 last:pb-10" delay={i === 0 ? 0 : 60}>
                <span aria-hidden className={`absolute top-1.5 -left-[4.5px] h-2 w-2 rounded-full border bg-void ${live ? "border-cyan shadow-[0_0_10px_#7fd8ff]" : "border-cyan/50"}`} />
                <div className="flex flex-wrap gap-x-2 text-[11px] tracking-[0.06em] text-mute">
                  <time dateTime={from ?? undefined}>[{from}]</time>
                  <span className="text-faint">→</span>
                  {to ? <time dateTime={to}>[{to}]</time> : <span className="text-cyan">[RUNNING]</span>}
                  <span className="text-faint">·</span>
                  <span>{e.location}</span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-light text-ink">
                  {e.company}
                  <span className="text-mute"> :: {e.role}</span>
                </h3>
                <div className="mt-1 text-[11px] tracking-[0.2em] text-violet uppercase">
                  domain={e.domain}
                  {e.client && <span className="text-mute"> · via={e.client}</span>}
                </div>
                <ul className="mt-4 space-y-2 text-ink/75">
                  {e.lines.map((l) => (
                    <li key={l} className="grid grid-cols-[auto_auto_1fr] gap-x-2">
                      <span className="text-cyan/70">INFO</span>
                      <span className="text-faint">│</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
          <li className="relative pl-8 text-mute" aria-hidden>
            <span className="absolute top-1.5 -left-[4.5px] h-2 w-2 rounded-full border border-faint bg-void" />
            <span className="text-cyan/70">awaiting next mission</span>
            <span className="cursor-blink ml-1 inline-block h-[1.1em] w-[0.55em] translate-y-[3px] bg-cyan/70" />
          </li>
        </ol>
      </div>
    </section>
  );
}
