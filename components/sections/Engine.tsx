import type { Engine as T } from "@/lib/content";
import { SectionHeader } from "@/components/ui";
import { EngineConsole } from "@/components/EngineConsole";

export function Engine({ data, email }: { data: T & { file: string }; email: string }) {
  return (
    <section id="engine" className="mx-auto max-w-6xl px-6 py-32 md:px-12">
      <SectionHeader index="06" title={data.heading} intro={data.intro} draftFile={data.draft ? data.file : undefined} />
      <div className="md:ml-[204px]">
        <EngineConsole greeting={data.greeting} suggestions={data.suggestions} email={email} />
        <p className="mt-4 font-mono text-[10px] tracking-[0.12em] text-faint">
          Answers come from an AI model, grounded only in what is on this site. It can be wrong, so for anything important, email Sagar.
        </p>
      </div>
    </section>
  );
}
