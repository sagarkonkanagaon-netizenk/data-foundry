import type { FlightLog as T } from "@/lib/content";
import { SectionHeader } from "@/components/ui";

export function FlightLog({ data }: { data: T & { file: string } }) {
  return (
    <section id="flight-log" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader index="04" title={data.heading} intro={data.intro} draftFile={data.draft ? data.file : undefined} />
      <ol className="relative border-l border-line font-mono text-[13px] md:ml-[204px]">
        {data.entries.map((e) => (
          <li key={e.company} className="relative pb-14 pl-8 last:pb-0">
            <span aria-hidden className="absolute top-1.5 -left-[4.5px] h-2 w-2 rounded-full border border-cyan bg-void" />
            <div className="text-[11px] tracking-[0.15em] text-mute">
              [{e.start} → {e.end}] <span className="text-faint">·</span> {e.location}
            </div>
            <h3 className="mt-2 font-display text-2xl font-light text-ink">
              {e.company}
              <span className="text-mute"> :: {e.role}</span>
            </h3>
            <div className="mt-1 text-[11px] tracking-[0.2em] text-violet uppercase">domain={e.domain}</div>
            <ul className="mt-4 space-y-2 text-ink/75">
              {e.lines.map((l) => (
                <li key={l}>
                  <span className="text-cyan/70">INFO</span> <span className="text-faint">│</span> {l}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
