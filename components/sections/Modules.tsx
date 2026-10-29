import type { Module } from "@/lib/content";
import { DraftTag, SectionHeader } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CapsuleScene, ModuleScenes } from "@/components/modules/ModuleScenes";

/** The module's pipeline as a little circuit: nodes joined by live, flowing links. */
export function MiniDiagram({ nodes }: { nodes: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2 font-mono text-[10px] tracking-wide text-mute">
      {nodes.map((n, i) => (
        <li key={n} className="flex items-center">
          {i > 0 && (
            <svg
              aria-hidden
              viewBox="0 0 22 6"
              className="mx-1 h-1.5 w-5.5 shrink-0"
            >
              <line
                x1="0"
                y1="3"
                x2="22"
                y2="3"
                stroke="#7fd8ff"
                strokeOpacity="0.25"
              />
              <line
                x1="0"
                y1="3"
                x2="22"
                y2="3"
                stroke="#7fd8ff"
                strokeOpacity="0.9"
                className="flow"
              />
            </svg>
          )}
          <span className="rounded-sm border border-line bg-void/40 px-1.5 py-1 transition-colors group-hover:border-cyan/30 group-hover:text-ink/80">
            {n}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Capsule({ m }: { m: Module & { file: string } }) {
  const accent = m.kind === "case-study" ? "text-violet" : "text-cyan";
  return (
    <article className="relative flex flex-col overflow-hidden rounded-[30px] border border-line bg-void-2/70 p-7 backdrop-blur-sm transition-[border-color,transform] duration-700 group-hover:-translate-y-0.5 group-hover:border-cyan/35 md:p-8">
      {m.scene && (
        <CapsuleScene scene={m.scene} label={`Animated scene: ${m.problem}`} />
      )}
      {/* glass sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan/5 blur-3xl transition-opacity duration-700 group-hover:bg-cyan/10"
      />
      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.22em] uppercase">
        <span className={accent}>{m.codename}</span>
        <span className="flex items-center gap-3 text-mute">
          {m.status}
          {m.draft && <DraftTag file={m.file} />}
        </span>
      </div>
      <h3 className="mt-4 text-2xl font-light tracking-tight">
        <a
          href={`/modules/${m.slug}`}
          className="after:absolute after:inset-0 group-hover:text-cyan"
        >
          {m.title}
        </a>
      </h3>
      <p className="mt-3 mb-6 text-ink/70">{m.problem}</p>
      <MiniDiagram nodes={m.diagram} />
      <div className="mt-auto flex items-end justify-between gap-4 pt-8">
        <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-mute">
          {m.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="shrink-0 text-right">
          <div className="text-3xl font-light text-ink">{m.impact.value}</div>
          <div className="font-mono text-[10px] tracking-[0.15em] text-mute uppercase">
            {m.impact.label}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Capsules docked along a central spine, alternating sides. Hovering a capsule
 * powers the line between it and its docking port. On mobile the spine runs
 * down the left edge and every capsule docks to the right of it.
 */
export function Modules({
  modules,
}: {
  modules: (Module & { file: string })[];
}) {
  return (
    <section id="modules" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader
        index="03"
        title="Modules"
        intro="Docked capsules. Three case studies from production, and four mini projects on the problems every pipeline eventually meets, each playing out live inside its capsule."
      />
      <ModuleScenes>
        <ol className="relative">
          {/* the spine */}
          <span
            aria-hidden
            className="absolute top-0 bottom-0 left-3 w-px bg-gradient-to-b from-transparent via-cyan/30 to-transparent md:left-1/2"
          />
          {modules.map((m, i) => {
            const left = i % 2 === 0;
            return (
              <Reveal
                as="li"
                key={m.slug}
                className="group relative grid pb-10 pl-10 md:grid-cols-2 md:gap-24 md:pl-0"
              >
                {/* docking port on the spine */}
                <span
                  aria-hidden
                  className="absolute top-1/2 left-3 z-10 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan/50 bg-void md:left-1/2"
                >
                  <span className="h-1 w-1 rounded-full bg-cyan/50 transition-[background-color,box-shadow] duration-500 group-hover:bg-cyan group-hover:shadow-[0_0_10px_#7fd8ff]" />
                </span>
                {/* power line from port to capsule */}
                <span
                  aria-hidden
                  className={`power-line absolute top-1/2 h-px w-7 left-3 md:w-12 ${left ? "md:left-auto md:right-1/2" : "md:left-1/2"}`}
                  style={{
                    ["--from" as string]: left ? "right" : "left",
                    ["--dir" as string]: left ? "270deg" : "90deg",
                  }}
                />
                <div className={left ? "md:col-start-1" : "md:col-start-2"}>
                  <Capsule m={m} />
                </div>
              </Reveal>
            );
          })}
        </ol>
      </ModuleScenes>
    </section>
  );
}
