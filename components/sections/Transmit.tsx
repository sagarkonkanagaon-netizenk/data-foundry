import type { Site, Transmit as T } from "@/lib/content";
import { SectionHeader } from "@/components/ui";
import { TransmitForm } from "@/components/TransmitForm";

export function Transmit({ data, site }: { data: T; site: Site }) {
  return (
    <section id="transmit" className="mx-auto max-w-6xl px-6 pt-32 pb-16 md:px-12">
      <SectionHeader index="07" title={data.heading} intro={data.intro} />
      <div className="md:ml-[204px]">
        <TransmitForm email={data.email} button={data.button} success={data.success} />
        <ul className="mt-16 flex flex-wrap gap-8 font-mono text-[11px] tracking-[0.2em] text-mute uppercase">
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
