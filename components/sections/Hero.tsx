import type { Module, Site, Stage } from "@/lib/content";
import { Schematic } from "@/components/Schematic";
import { MachineLoader } from "@/components/machine/MachineLoader";
import { DraftTag } from "@/components/ui";
import { FeedSwitch, Hud, RunLine } from "@/components/Hud";
import { ChaosDirector, ChaosPanel, IncidentCard, type ChaosItem } from "@/components/Chaos";
import { ScrollTracker, TourBlocks } from "@/components/Tour";

type WithHtml<T> = T & { html: string; file: string };

/**
 * The machine stays pinned while the page scrolls through it: first the hero (name,
 * chaos controls, live HUD), then one caption block per stage as the camera flies
 * the tour. Everything here is server-rendered text, so it reads fine without WebGL.
 */
export function Hero({ site, stages, chaos, modules }: { site: WithHtml<Site>; stages: WithHtml<Stage>[]; chaos: ChaosItem[]; modules: Module[] }) {
  const blocks = stages.length + 1;
  return (
    <div id="foundry" className="relative" style={{ ["--hero" as string]: 1 }}>
      <ScrollTracker targetId="foundry" blocks={blocks} />
      <ChaosDirector />
      <div className="sticky top-0 h-svh overflow-hidden">
        <MachineLoader stages={stages}>
          <Schematic stages={stages} />
        </MachineLoader>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-void via-void/70 to-transparent" style={{ opacity: "var(--hero)" }} />

        <header
          className="pointer-events-none absolute inset-0 flex flex-col px-6 pt-8 pb-12 transition-[visibility] md:px-12 [&_a]:pointer-events-auto [&_button]:pointer-events-auto"
          style={{ opacity: "var(--hero)" }}
        >
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
          <div className="mt-5 flex items-start justify-between gap-6">
            <RunLine />
            <span className="hidden font-mono text-[10px] tracking-[0.2em] text-mute uppercase md:block">
              {site.location} · 12.97°N 77.59°E
            </span>
          </div>
          <div className="absolute top-28 right-6 z-20 md:right-12">
            <IncidentCard items={chaos} />
          </div>

          <div className="mt-auto grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-[11px] tracking-[0.25em] text-cyan/70 uppercase">{site.kicker}</p>
              <h1 className="mt-3 text-3xl font-light tracking-tight md:text-5xl lg:whitespace-nowrap">
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
            <div className="w-full space-y-8 lg:w-[min(56vw,720px)]">
              <FeedSwitch />
              <ChaosPanel items={chaos} />
              <Hud tasks={stages.find((s) => s.id === "orchestrator")?.tasks ?? []} />
            </div>
          </div>
        </header>
      </div>
      <TourBlocks intro={site.html} stages={stages} modules={modules} />
    </div>
  );
}
