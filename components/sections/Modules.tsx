import type { Module } from "@/lib/content";
import { DraftTag, SectionHeader } from "@/components/ui";

export function MiniDiagram({ nodes }: { nodes: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2 font-mono text-[10px] tracking-wide text-mute">
      {nodes.map((n, i) => (
        <li key={n} className="flex items-center">
          {i > 0 && <span aria-hidden className="mx-1.5 h-px w-4 bg-cyan/40" />}
          <span className="rounded-sm border border-line px-1.5 py-1">{n}</span>
        </li>
      ))}
    </ol>
  );
}

export function Modules({ modules }: { modules: (Module & { file: string })[] }) {
  return (
    <section id="modules" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader index="02" title="Modules" intro="Docked capsules. Each one is a project that plugs into the machine." />
      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((m) => (
          <article key={m.slug} className="group relative flex flex-col rounded-[28px] border border-line bg-void-2/60 p-7 transition-colors hover:border-cyan/35">
            {/* docking clamps */}
            <span aria-hidden className="absolute top-1/2 -left-px h-10 w-[3px] -translate-y-1/2 rounded-r bg-cyan/30" />
            <span aria-hidden className="absolute top-1/2 -right-px h-10 w-[3px] -translate-y-1/2 rounded-l bg-cyan/30" />
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.22em] uppercase">
              <span className={m.kind === "case-study" ? "text-violet" : "text-cyan"}>{m.codename}</span>
              <span className="flex items-center gap-3 text-mute">
                {m.status}
                {m.draft && <DraftTag file={m.file} />}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-light">
              <a href={`/modules/${m.slug}`} className="after:absolute after:inset-0 group-hover:text-cyan">
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
                <div className="font-mono text-[10px] tracking-[0.15em] text-mute uppercase">{m.impact.label}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
