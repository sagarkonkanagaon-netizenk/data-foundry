import type { Site, Transmit as T } from "@/lib/content";
import { SectionHeader } from "@/components/ui";

// Plain mailto for now. Step 6 adds the signal-beam animation and a serverless send.
export function Transmit({ data, site }: { data: T; site: Site }) {
  return (
    <section id="transmit" className="mx-auto max-w-6xl px-6 pt-32 pb-16 md:px-12">
      <SectionHeader index="06" title={data.heading} intro={data.intro} />
      <div className="md:ml-[204px]">
        <a href={`mailto:${data.email}`} className="text-2xl font-light text-cyan underline decoration-line underline-offset-8 hover:decoration-cyan md:text-4xl">
          {data.email}
        </a>
        <ul className="mt-10 flex flex-wrap gap-8 font-mono text-[11px] tracking-[0.2em] text-mute uppercase">
          {site.links.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="hover:text-ink">
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </div>
      <footer className="mt-32 flex justify-between font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
        <span>The Data Foundry</span>
        <span>{site.location}</span>
      </footer>
    </section>
  );
}
