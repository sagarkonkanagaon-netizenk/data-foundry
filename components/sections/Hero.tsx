import type { Site, Stage } from "@/lib/content";
import { Schematic } from "@/components/Schematic";
import { DraftTag } from "@/components/ui";

export function Hero({ site, stages }: { site: Site & { html: string; file: string }; stages: Stage[] }) {
  return (
    <section className="relative flex min-h-svh flex-col px-6 pt-8 pb-16 md:px-12">
      <nav className="flex items-center justify-between font-mono text-[11px] tracking-[0.22em] text-mute uppercase">
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

      {/* Slot for the 3D machine (step 2). Until it loads, and forever without WebGL, the schematic stands in. */}
      <div id="machine-stage" className="relative mx-auto my-auto w-full max-w-6xl py-10">
        <Schematic stages={stages} />
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-cyan/70 uppercase">{site.kicker}</p>
          <h1 className="mt-3 text-5xl font-light tracking-tight md:text-7xl">
            {site.name}
            <span className="text-mute"> · {site.title}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{site.tagline}</p>
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
          <dd className="text-ink">~{site.years} yrs</dd>
          <dt>Status</dt>
          <dd className="text-cyan">● Nominal</dd>
        </dl>
      </div>
    </section>
  );
}
