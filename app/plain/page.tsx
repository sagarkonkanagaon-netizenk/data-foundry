import type { Metadata } from "next";
import { getFlightLog, getModules, getPlain, getSite, getTransmit } from "@/lib/content";
import { Actions, Results } from "@/components/Intro";
import { PIPELINE_CODE, PIPELINE_DATA_TREE, getRuns, type RunReport, type RunSummary } from "@/lib/runs";

// The page without the machine: the same facts, server-rendered, no WebGL and no
// client components. For slow phones, screen readers, and anyone short on time.

export const revalidate = 300;

export function generateMetadata(): Metadata {
  const p = getPlain();
  return { title: p.seoTitle, description: p.seoDescription, alternates: { canonical: "/plain" } };
}

const fmt = (n: number | undefined | null) => (n == null ? "–" : n.toLocaleString("en-US"));
const when = (runId: string) => {
  const m = runId.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]} UTC` : runId;
};
const month = (ym: string) => {
  if (ym === "present") return "present";
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1)).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
};
const TONE: Record<string, string> = { passed: "text-cyan", warned: "text-amber", failed: "text-error" };

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-6 font-mono text-[11px] tracking-[0.25em] text-cyan/80 uppercase">
      {children}
    </h2>
  );
}

function Latest({ r }: { r: RunReport }) {
  const dq = r.dq.filter((c) => c.status !== "skip");
  const passed = dq.filter((c) => c.status === "pass").length;
  const facts: [string, string][] = [
    ["Status", r.status],
    ["Run", when(r.run_id)],
    ["Rows landed", fmt(r.rows.landed)],
    ["Rows to silver", fmt(r.rows.silver)],
    ["Quarantined", fmt(r.rows.quarantine)],
    ["DQ checks passed", `${passed} of ${dq.length}`],
    ["Run time", r.duration_s == null ? "–" : `${Math.round(r.duration_s)} s`],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      {facts.map(([k, v]) => (
        <div key={k}>
          <dt className="font-mono text-[10px] tracking-[0.2em] text-mute uppercase">{k}</dt>
          <dd className={`mt-1 text-lg ${k === "Status" ? TONE[v] ?? "" : "text-ink"}`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function History({ runs, label }: { runs: RunSummary[]; label: string }) {
  if (!runs.length) return null;
  return (
    <div className="mt-8">
      <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-mute uppercase">{label}</h3>
      <ul className="divide-y divide-line border-y border-line text-sm">
        {runs.slice(0, 8).map((r) => (
          <li key={r.run_id} className="flex flex-wrap justify-between gap-x-4 py-2">
            <span className="text-ink/85">{when(r.run_id)}</span>
            <span className="font-mono text-xs text-mute">
              <span className={TONE[r.status]}>{r.status}</span> · {fmt(r.rows_in)} rows · {r.rejects} rejects
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Plain() {
  const site = getSite();
  const p = getPlain();
  const log = getFlightLog();
  const modules = getModules();
  const email = getTransmit().email;
  const runs = await getRuns();
  const link = "underline decoration-line underline-offset-4 hover:text-ink hover:decoration-cyan";

  return (
    <main id="content" className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      <nav className="flex items-center justify-between font-mono text-[11px] tracking-[0.22em] text-mute uppercase">
        <span>
          <span className="text-cyan">●</span> The Data Foundry
        </span>
        <a href="/" className="text-cyan/80 hover:text-ink">
          {p.backLabel} →
        </a>
      </nav>

      <header className="mt-12">
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">
          {site.name}
          <span className="mt-2 block font-mono text-sm tracking-[0.3em] text-mute uppercase">{site.title}</span>
        </h1>
        <p className="mt-4 text-lg text-ink/80">{site.tagline}</p>
        <p className="mt-1 text-sm text-mute">
          {site.location} · {site.years} years
        </p>
        <Results site={site} className="mt-8" />
        <Actions site={site} contact="#contact" className="mt-8" />
      </header>

      <section className="mt-16" aria-labelledby="pipeline">
        <Heading id="pipeline">{p.pipelineHeading}</Heading>
        <p className="mb-6 text-ink/75">{p.pipelineIntro}</p>
        {runs.latest ? <Latest r={runs.latest} /> : <p className="text-mute">{p.pipelineEmpty}</p>}
        <History runs={runs.index?.runs ?? []} label={p.historyLabel} />
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mute">
          <a className={link} href={PIPELINE_CODE}>Pipeline code</a>
          <a className={link} href={PIPELINE_DATA_TREE}>All run reports</a>
          {runs.latest?.code.workflow_run && <a className={link} href={runs.latest.code.workflow_run}>Latest CI log</a>}
        </p>
      </section>

      <section className="mt-16" aria-labelledby="experience">
        <Heading id="experience">{p.experienceHeading}</Heading>
        <ol className="space-y-8">
          {log.entries.map((e) => (
            <li key={`${e.company}-${e.start}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="text-lg text-ink">
                  {e.role} · {e.company}
                  {e.client && <span className="text-mute"> (via {e.client})</span>}
                </h3>
                <span className="font-mono text-xs text-mute">
                  {month(e.start)} – {month(e.end)} · {e.location}
                </span>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-ink/75 marker:text-faint">
                {e.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16" aria-labelledby="work">
        <Heading id="work">{p.workHeading}</Heading>
        <ul className="divide-y divide-line border-y border-line">
          {modules.map((m) => (
            <li key={m.slug}>
              <a href={`/modules/${m.slug}`} className="group block py-4">
                <span className="font-mono text-[10px] tracking-[0.2em] text-mute uppercase">{m.kind.replace("-", " ")}</span>
                <span className="mt-1 block text-ink group-hover:text-cyan">{m.title}</span>
                <span className="mt-1 block text-sm text-ink/65">{m.problem}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="contact">
        <Heading id="contact">{p.contactHeading}</Heading>
        <p className="text-ink/75">{p.contactIntro}</p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <a className={`text-lg text-cyan ${link}`} href={`mailto:${email}`}>
            {email}
          </a>
          <a className={`text-sm text-mute ${link}`} href="/#transmit">
            {p.formLabel}
          </a>
        </p>
      </section>
    </main>
  );
}
