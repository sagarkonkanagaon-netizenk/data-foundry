import type { Chaos, Module, Stage } from "@/lib/content";
import { SectionHeader } from "@/components/ui";

type WithHtml<T> = T & { html: string; file: string };

// The machine, explained in plain text. This is what search engines and no-WebGL
// visitors read; in step 2 the same entries become the glass panels on chamber click.
export function Manual({ site, stages, chaos, modules }: { site: { html: string }; stages: WithHtml<Stage>[]; chaos: WithHtml<Chaos>[]; modules: Module[] }) {
  const titleOf = (slug?: string) => modules.find((m) => m.slug === slug);
  return (
    <section id="machine" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader index="01" title="The machine" />
      <div className="prose-foundry mb-20 max-w-2xl text-lg md:ml-[204px]" dangerouslySetInnerHTML={{ __html: site.html }} />

      <ol className="border-t border-line">
        {stages.map((s) => {
          const p = titleOf(s.project);
          return (
            <li key={s.id} id={`stage-${s.id}`} className="grid gap-6 border-b border-line py-10 md:grid-cols-[180px_1fr_260px]">
              <div className="font-mono text-[11px] tracking-[0.22em] uppercase" style={{ color: s.color }}>
                {s.label}
              </div>
              <div>
                <h3 className="text-2xl font-light">{s.title}</h3>
                <p className="mt-1 mb-5 text-mute">{s.summary}</p>
                <div className="prose-foundry max-w-2xl" dangerouslySetInnerHTML={{ __html: s.html }} />
              </div>
              {p && (
                <a href={`/modules/${p.slug}`} className="group self-start rounded-md border border-line p-4 transition-colors hover:border-cyan/40">
                  <div className="font-mono text-[10px] tracking-[0.2em] text-mute uppercase">Built it · {p.codename}</div>
                  <div className="mt-2 text-sm text-ink group-hover:text-cyan">{p.title} →</div>
                </a>
              )}
            </li>
          );
        })}
      </ol>

      <h3 className="mt-24 mb-8 font-mono text-[11px] tracking-[0.25em] text-mute uppercase">Chaos playbook · what the sentinel does</h3>
      <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-2">
        {chaos.map((c) => (
          <article key={c.id} className="bg-void p-6 md:last:odd:col-span-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg">{c.label}</h4>
              <span className={`font-mono text-[10px] tracking-[0.2em] uppercase ${c.severity === "error" ? "text-error" : "text-amber"}`}>
                {c.severity} · {c.stage}
              </span>
            </div>
            <pre className="mt-4 overflow-x-auto font-mono text-[12px] leading-6 whitespace-pre-wrap">
              <span className={c.severity === "error" ? "text-error" : "text-amber"}>▲ {c.detect}</span>
              {"\n"}
              <span className="text-mute">◆ {c.diagnose}</span>
              {"\n"}
              <span className="text-cyan">✓ {c.heal}</span>
            </pre>
            <div className="prose-foundry mt-4 text-sm" dangerouslySetInnerHTML={{ __html: c.html }} />
          </article>
        ))}
      </div>
    </section>
  );
}
