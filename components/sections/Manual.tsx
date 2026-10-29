import type { Chaos } from "@/lib/content";
import { SectionHeader } from "@/components/ui";

type WithHtml<T> = T & { html: string; file: string };

// The incident playbook in plain text: the same entries the INJECT CHAOS buttons play
// out on the machine, readable without WebGL.
export function Manual({ chaos }: { chaos: WithHtml<Chaos>[] }) {
  return (
    <section id="playbook" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader index="02" title="Chaos playbook" />
      <p className="mb-12 max-w-2xl text-lg text-mute md:ml-[204px]">What the sentinel does when something breaks. The five failures every pipeline eventually meets. Press INJECT CHAOS above to watch each one play out.</p>
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
