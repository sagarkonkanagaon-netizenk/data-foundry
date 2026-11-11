import type { Site } from "@/lib/content";

// The first screen's facts: the four results and the four buttons. Server-rendered,
// no client JS, shared by the hero and the plain view. All text comes from content/site.md.

export function Results({ site, className = "" }: { site: Site; className?: string }) {
  return (
    <ul className={`grid gap-x-8 gap-y-2.5 sm:grid-cols-2 sm:gap-y-4 ${className}`} aria-label="Selected results">
      {site.results.map((r) => (
        <li key={r.org} className="border-l border-cyan/30 pl-3">
          <span className="block font-mono text-[9px] tracking-[0.22em] text-cyan/80 uppercase sm:text-[10px]">{r.org}</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-ink/85 sm:text-sm">{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** The four buttons. `contact` replaces the Contact link's href (the plain view has its own contact section). */
export function Actions({ site, contact, className = "" }: { site: Site; contact?: string; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 sm:gap-3 ${className}`}>
      {site.actions.map((a, i) => {
        const href = contact && a.href.startsWith("#") ? contact : a.href;
        const external = href.startsWith("http");
        return (
          <a
            key={a.label}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={
              i === 0
                ? "inline-flex min-h-10 items-center rounded-full bg-cyan px-4 font-mono text-[11px] tracking-[0.16em] text-void uppercase transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
                : "inline-flex min-h-10 items-center rounded-full border border-line bg-void/40 px-4 font-mono text-[11px] tracking-[0.16em] text-ink/85 uppercase backdrop-blur transition-colors hover:border-cyan/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            }
          >
            {a.label}
            {external && <span aria-hidden className="ml-1.5 text-mute">↗</span>}
          </a>
        );
      })}
    </div>
  );
}
