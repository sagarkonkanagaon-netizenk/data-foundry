import matter from "gray-matter";
import { getKnowledge } from "@/lib/content";

// Retrieval for Ask the Engine. The knowledge base is every markdown file in /content,
// split into small passages and ranked per question with BM25. It is tiny (tens of
// passages), so it is built once per server instance and searched in memory.

export type Passage = { source: string; text: string };

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
  const out: Passage[] = [];
  // Flight log entries and instrument groups are long lists: one passage per item.
  if (Array.isArray(data.entries)) {
    for (const e of data.entries) out.push({ source, text: flatten(e) });
  } else if (Array.isArray(data.groups)) {
    for (const g of data.groups) out.push({ source, text: flatten(g) });
  }
  const meta = flatten(Object.fromEntries(Object.entries(data).filter(([k]) => k !== "entries" && k !== "groups")));
  if (meta) out.push({ source, text: meta });
  let buf = "";
  for (const para of content.split(/\n\s*\n/)) {
    if (buf && buf.length + para.length > 900) {
      out.push({ source, text: buf.trim() });
      buf = "";
    }
    buf += para + "\n\n";
  }
  if (buf.trim()) out.push({ source, text: buf.trim() });
  return out;
}

type Index = { passages: Passage[]; tf: Map<string, number>[]; len: number[]; df: Map<string, number>; avg: number };
let index: Index | null = null;

function build(): Index {
  const passages = getKnowledge().flatMap((k) => chunk(k.file, k.text));
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
    return { p, s };
  });
  const overview = passages.filter((p) => p.source.startsWith("content/site.md") || p.source.startsWith("content/engine.md"));
  const top = scored
    .filter((x) => x.s > 0 && !overview.includes(x.p))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.p);
  return [...overview, ...top];
}
