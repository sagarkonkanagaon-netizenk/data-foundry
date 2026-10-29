import type { Site, Stage } from "@/lib/content";
import { Schematic } from "@/components/Schematic";
import { MachineLoader } from "@/components/machine/MachineLoader";
import { DraftTag } from "@/components/ui";

export function Hero({ site, stages }: { site: Site & { html: string; file: string }; stages: Stage[] }) {
  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden px-6 pt-8 pb-12 md:px-12">
      <MachineLoader stages={stages}>
        <Schematic stages={stages} />
      </MachineLoader>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-void via-void/70 to-transparent" />

      <nav className="relative z-10 flex items-center justify-between font-mono text-[11px] tracking-[0.22em] text-mute uppercase">
        <span>
          <span className="text-cyan">●</span> The Data Foundry
        </span>
        <span className="hidden gap-8 md:flex">
          <a href="#machine" className="hover:text-ink">Machine</a>
          <a href="#modules" className="hover:text-ink">Modules</a>
          <a href="#instruments" className="hover:text-ink">Instruments</a>
          <a href="#flight-log" className="hover:text-ink">Flight log</a>
          <a href="#transmit" className="hover:text-ink">Transmit</a>
        </span>
      </nav>

      <div className="pointer-events-none relative z-10 mt-auto grid gap-8 [&_a]:pointer-events-auto md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-cyan/70 uppercase">{site.kicker}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight md:text-5xl">
            {site.name}
            <span className="mt-2 block font-mono text-xs tracking-[0.3em] text-mute uppercase md:text-sm">{site.title}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink/75 md:text-lg">{site.tagline}</p>
          {site.draft && (
            <div className="mt-4">
              <DraftTag file={site.file} />
            </div>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-[11px] tracking-[0.15em] text-mute uppercase">
          <dt>Location</dt>
          <dd className="text-ink">{site.location}</dd>
          <dt>Runtime</dt>
          <dd className="text-ink">{site.years} yrs</dd>
          <dt>Status</dt>
          <dd className="text-cyan">● Nominal</dd>
        </dl>
      </div>
    </section>
  );
}
