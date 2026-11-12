import matter from "gray-matter";
import { getKnowledge } from "@/lib/content";

// Retrieval for Ask the Engine. The knowledge base is every markdown file in /content,
// split into small passages and ranked per question with BM25. It is tiny (tens of
// passages), so it is built once per server instance and searched in memory.

/** A piece of knowledge, with where a visitor can check it: `label` and `href` back each citation. */
export type Passage = { source: string; text: string; label: string; href: string };

/** Where on the site each content file is shown, so a citation links to the page that says it. */
function place(file: string, data: Record<string, unknown>): { label: string; href: string } {
  const name = file.replace(/^content\//, "");
  const title = String(data.title || data.heading || data.label || "");
  if (name.startsWith("modules/")) return { label: title, href: `/modules/${data.slug}` };
  if (name.startsWith("machine/")) return { label: `${title} (the machine)`, href: `/#tour-${data.id}` };
  if (name.startsWith("chaos/")) return { label: `${title} drill`, href: "/#machine" };
  if (name === "flight-log.md") return { label: "Flight log", href: "/#flight-log" };
  if (name === "instruments.md") return { label: "Instruments", href: "/#instruments" };
  if (name === "transmit.md") return { label: "Contact", href: "/#transmit" };
  if (name === "site.md") return { label: "Site overview", href: "/" };
  if (name === "faq.md" || name === "engine.md") return { label: "Sagar's notes for the engine", href: `https://github.com/sagarkonkanagaon-netizenk/data-foundry/blob/main/content/${name}` };
  return { label: title || name, href: "/" };
}

const STOP = new Set(
  "a an and are as at be but by can did do does for from has have he her his how i in is it its me my of on or our she so that the their them they this to was we what when where which who why will with you your about into than then there these those would could should also just".split(
    " ",
  ),
);
const terms = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((w) => w.length > 1 && !STOP.has(w));

// Frontmatter keys that are presentation or instructions, not facts.
const SKIP_KEYS = new Set(["persona", "color", "order", "draft", "links", "suggestions", "greeting", "id", "slug", "label", "scene", "button"]);

function flatten(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && v != null && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("\n");
}

function chunk(file: string, raw: string): Passage[] {
  const parsed = matter(raw);
  const data = parsed.data;
  // placeholders Sagar hasn't filled in yet are not facts
  const content = parsed.content
    .split("\n")
    .filter((l) => !/\(edit me/i.test(l))
    .join("\n");
  const title = (data.title || data.heading || data.label || data.name || file) as string;
  const source = `${file} (${title})`;
  const at = place(file, data);
  const out: Passage[] = [];
  const push = (text: string) => out.push({ source, text, ...at });
  // The FAQ is question/answer pairs: one passage per "## " question, so each answer stays with its question.
  if (file.endsWith("faq.md")) {
    for (const qa of content.replace(/<!--[\s\S]*?-->/g, "").split(/^(?=## )/m)) {
      if (qa.startsWith("## ")) push(qa.trim());
    }
    return out;
  }
  // Flight log entries and instrument groups are long lists: one passage per item.
  if (Array.isArray(data.entries)) {
    for (const e of data.entries) push(flatten(e));
  } else if (Array.isArray(data.groups)) {
    for (const g of data.groups) push(flatten(g));
  }
  const meta = flatten(Object.fromEntries(Object.entries(data).filter(([k]) => k !== "entries" && k !== "groups")));
  if (meta) push(meta);
  let buf = "";
  for (const para of content.split(/\n\s*\n/)) {
    if (buf && buf.length + para.length > 900) {
      push(buf.trim());
      buf = "";
    }
    buf += para + "\n\n";
  }
  if (buf.trim()) push(buf.trim());
  return out;
}

type Index = { passages: Passage[]; tf: Map<string, number>[]; len: number[]; df: Map<string, number>; avg: number };
let index: Index | null = null;

function build(): Index {
  const passages = getKnowledge()
    .filter((k) => !k.file.endsWith("plain.md") && !k.file.endsWith("README.md"))
    .flatMap((k) => chunk(k.file, k.text));
  const df = new Map<string, number>();
  const tf = passages.map((p) => {
    const m = new Map<string, number>();
    for (const t of terms(`${p.source} ${p.text}`)) m.set(t, (m.get(t) ?? 0) + 1);
    for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return m;
  });
  const len = tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
  return { passages, tf, len, df, avg: len.reduce((a, b) => a + b, 0) / Math.max(1, len.length) };
}

/** The k passages most relevant to the query (BM25), always including the site overview and extra facts. */
export function retrieve(query: string, k = 8): Passage[] {
  index ??= build();
  const { passages, tf, len, df, avg } = index;
  const N = passages.length;
  const q = [...new Set(terms(query))];
  const scored = passages.map((p, i) => {
    let s = 0;
    for (const t of q) {
      const f = tf[i].get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      s += (idf * f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (len[i] / avg)));
    }
    // Sagar's own written answers win over passages that merely mention the same words
    return { p, s: p.source.startsWith("content/faq.md") ? s * 1.5 : s };
  });
  const overview = passages.filter((p) => p.source.startsWith("content/site.md") || p.source.startsWith("content/engine.md"));
  const top = scored
    .filter((x) => x.s > 0 && !overview.includes(x.p))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.p);
  return [...overview, ...top];
}
