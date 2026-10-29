export function DraftTag({ file }: { file: string }) {
  return (
    <span
      title={`Drafted placeholder. Edit ${file} and set draft: false.`}
      className="inline-flex items-center gap-1.5 rounded-sm border border-amber/40 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.18em] text-amber/90 uppercase"
    >
      <span className="h-1 w-1 rounded-full bg-amber" />
      Draft
    </span>
  );
}

export function SectionHeader({
  index,
  title,
  intro,
  draftFile,
}: {
  index: string;
  title: string;
  intro?: string;
  draftFile?: string;
}) {
  return (
    <header className="mb-14 grid gap-6 md:grid-cols-[180px_1fr]">
      <div className="font-mono text-[11px] tracking-[0.25em] text-mute uppercase">
        <span className="text-cyan/70">§{index}</span>
        <span className="mx-2 text-faint">/</span>
        {title}
      </div>
      <div>
        <h2 className="text-3xl font-light tracking-tight text-ink md:text-5xl">{title}</h2>
        {intro && <p className="mt-4 max-w-xl text-mute">{intro}</p>}
        {draftFile && (
          <div className="mt-4">
            <DraftTag file={draftFile} />
          </div>
        )}
      </div>
    </header>
  );
}

export function Hairline() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-line to-transparent" />;
}
