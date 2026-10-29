import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getModule, getModules } from "@/lib/content";
import { MiniDiagram } from "@/components/sections/Modules";
import { DraftTag } from "@/components/ui";
import { CapsuleScene, ModuleScenes } from "@/components/modules/ModuleScenes";

export const dynamicParams = false;

export function generateStaticParams() {
  return getModules().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = getModule((await params).slug);
  if (!m) return {};
  const url = `/modules/${m.slug}`;
  return {
    title: m.title,
    description: m.problem,
    alternates: { canonical: url },
    openGraph: { title: m.title, description: m.problem, type: "article", url },
  };
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const m = getModule((await params).slug);
  if (!m) notFound();
  return (
    <main id="content" className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <a href="/#modules" className="font-mono text-[11px] tracking-[0.22em] text-mute uppercase hover:text-ink">
        ← Back to the foundry
      </a>
      <div className="mt-16 flex items-center gap-4 font-mono text-[11px] tracking-[0.22em] uppercase">
        <span className={m.kind === "case-study" ? "text-violet" : "text-cyan"}>{m.codename}</span>
        <span className="text-mute">{m.status}</span>
        {m.draft && <DraftTag file={m.file} />}
      </div>
      <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">{m.title}</h1>
      <p className="mt-6 text-lg text-ink/75">{m.problem}</p>
      {m.scene && (
        <ModuleScenes>
          <CapsuleScene scene={m.scene} label={`Animated scene: ${m.problem}`} large />
        </ModuleScenes>
      )}
      <div className="my-12 grid gap-8 border-y border-line py-8 md:grid-cols-[1fr_auto]">
        <MiniDiagram nodes={m.diagram} />
        <div className="md:text-right">
          <div className="text-4xl font-light">{m.impact.value}</div>
          <div className="font-mono text-[10px] tracking-[0.15em] text-mute uppercase">{m.impact.label}</div>
        </div>
      </div>
      <div className="prose-foundry text-lg" dangerouslySetInnerHTML={{ __html: m.html }} />
      <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-mute">
        {m.stack.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <div className="mt-8 flex gap-6 font-mono text-[11px] tracking-[0.2em] uppercase">
        {m.links.map((l) => (
          <a key={l.label} href={l.href} className="text-cyan hover:text-ink">
            {l.label} ↗
          </a>
        ))}
      </div>
    </main>
  );
}
