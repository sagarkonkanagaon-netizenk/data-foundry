import type { Module, Site, Stage } from "@/lib/content";
import { Schematic } from "@/components/Schematic";
import { MachineLoader } from "@/components/machine/MachineLoader";
import { DraftTag } from "@/components/ui";
import { Hud, RenderSwitch, ReplayLatest, RunLine } from "@/components/Hud";
import { AutoReplay, ChaosDirector, ChaosPanel, IncidentCard, type ChaosItem } from "@/components/Chaos";
import { RunDetail, RunHistory } from "@/components/RunHistory";
import { RunsInit } from "@/components/RunsInit";
import type { Runs } from "@/lib/runs";
import { ScrollTracker, TourBlocks } from "@/components/Tour";
import { Actions, Results } from "@/components/Intro";

type WithHtml<T> = T & { html: string; file: string };

/**
 * The machine stays pinned while the page scrolls through it: first the hero (name,
 * chaos controls, live HUD), then one caption block per stage as the camera flies
 * the tour. Everything here is server-rendered text, so it reads fine without WebGL.
 */
export function Hero({ site, stages, chaos, modules, runs }: { site: WithHtml<Site>; stages: WithHtml<Stage>[]; chaos: ChaosItem[]; modules: Module[]; runs: Runs }) {
  const blocks = stages.length + 1;
  return (
    <div id="foundry" className="relative" style={{ ["--hero" as string]: 1 }}>
      <ScrollTracker targetId="foundry" blocks={blocks} />
      <RunsInit index={runs.index} latest={runs.latest} />
      <ReplayLatest />
      <AutoReplay />
      <ChaosDirector />
      <RunDetail />
      <div className="sticky top-0 h-svh overflow-hidden">
        <MachineLoader stages={stages}>
          <Schematic stages={stages} />
        </MachineLoader>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-void via-void/85 to-transparent lg:h-72 lg:via-void/70" style={{ opacity: "var(--hero)" }} />
        {/* keeps the name and results legible where they sit over the machine */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{ opacity: "var(--hero)", background: "radial-gradient(ellipse 52% 62% at 18% 78%, rgb(5 7 13 / 0.94) 45%, rgb(5 7 13 / 0) 100%)" }}
        />

        <header
          className="pointer-events-none absolute inset-0 flex flex-col px-6 pt-6 pb-8 sm:pt-8 sm:pb-12 transition-[visibility] md:px-12 [&_a]:pointer-events-auto [&_button]:pointer-events-auto"
          style={{ opacity: "var(--hero)" }}
        >
          <nav className="flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.16em] whitespace-nowrap text-mute uppercase sm:text-[11px] sm:tracking-[0.22em]">
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
            <a href="/plain" className="text-cyan/80 hover:text-ink md:hidden">{site.plainLabel} →</a>
          </nav>
          <div className="mt-5 hidden items-start justify-between gap-6 sm:flex">
            <RunLine latest={runs.latest} />
            <span className="hidden font-mono text-[10px] tracking-[0.2em] text-mute uppercase md:block">
              {site.location} · 12.97°N 77.59°E
            </span>
          </div>
          <div className="absolute top-28 right-6 z-20 md:right-12">
            <IncidentCard items={chaos} />
          </div>

          <div className="mt-auto grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0 lg:max-w-[min(44vw,640px)]">
              <p className="hidden font-mono text-[11px] tracking-[0.25em] text-cyan/70 uppercase sm:block">{site.kicker}</p>
              <h1 className="text-[28px] leading-tight font-light tracking-tight sm:mt-3 sm:text-3xl md:text-5xl lg:whitespace-nowrap">
                {site.name}
                <span className="mt-1.5 block font-mono text-xs tracking-[0.3em] text-mute uppercase md:mt-2 md:text-sm">{site.title}</span>
              </h1>
              <p className="mt-2.5 max-w-xl text-[15px] text-ink/80 sm:mt-4 md:text-lg">{site.tagline}</p>
              <Results site={site} className="mt-4 sm:mt-6" />
              <Actions site={site} className="mt-5 sm:mt-6" />
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.2em] uppercase">
                {site.openToWork && (
                  <a href="#transmit" className="inline-flex items-center gap-2 text-cyan hover:text-ink">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full bg-cyan motion-safe:animate-ping" />
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                    </span>
                    Open to new roles
                  </a>
                )}
                <a href="/plain" className="hidden text-mute hover:text-ink md:inline">{site.plainLabel} →</a>
                {site.draft && <DraftTag file={site.file} />}
              </div>
            </div>
            <div className="hidden w-full min-w-0 space-y-8 lg:block lg:w-[min(50vw,720px)]">
              <div className="flex items-end gap-4">
                <div className="min-w-0 flex-1">
                  <RunHistory index={runs.index} />
                </div>
                <RenderSwitch />
              </div>
              <Hud latest={runs.latest} runs={runs.index?.runs ?? []} />
              <ChaosPanel items={chaos} />
            </div>
          </div>
        </header>
      </div>
      <TourBlocks intro={site.html} stages={stages} modules={modules}>
        {/* below lg the first screen keeps to the essentials; the readouts and drills come next */}
        <div className="mb-8 space-y-8 border-b border-line pb-8 lg:hidden">
          <div className="sm:hidden">
            <RunLine latest={runs.latest} />
          </div>
          <div className="flex items-end gap-4">
            <div className="min-w-0 flex-1">
              <RunHistory index={runs.index} />
            </div>
            <RenderSwitch />
          </div>
          <Hud latest={runs.latest} runs={runs.index?.runs ?? []} />
          <ChaosPanel items={chaos} />
        </div>
      </TourBlocks>
    </div>
  );
}
