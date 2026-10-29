import type { Engine as T } from "@/lib/content";
import { SectionHeader } from "@/components/ui";

// Static shell for now. Step 7 wires it to a rate-limited serverless RAG endpoint.
export function Engine({ data }: { data: T & { file: string } }) {
  return (
    <section id="engine" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader index="06" title={data.heading} intro={data.intro} draftFile={data.draft ? data.file : undefined} />
      <div className="rounded-md border border-line bg-void-2/60 font-mono text-[13px] md:ml-[204px]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-[10px] tracking-[0.2em] text-mute uppercase">
          <span>engine://sagar</span>
          <span className="text-amber">offline · step 7</span>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-cyan">{data.greeting}</p>
          <ul className="flex flex-wrap gap-2">
            {data.suggestions.map((s) => (
              <li key={s} className="rounded-sm border border-line px-2 py-1 text-mute">
                {s}
              </li>
            ))}
          </ul>
          <p className="text-faint">&gt; _</p>
        </div>
      </div>
    </section>
  );
}
