import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

// All site copy lives in /content. These loaders are the only place that reads it,
// so the rest of the app deals in typed objects, never in files.

const ROOT = path.join(process.cwd(), "content");

type Doc<T> = T & { body: string; html: string; file: string };

function read<T>(rel: string): Doc<T> {
  const file = path.join(ROOT, rel);
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    ...(data as T),
    body: content.trim(),
    html: marked.parse(content, { async: false }) as string,
    file: `content/${rel}`,
  };
}

function readDir<T extends { order?: number }>(dir: string): Doc<T>[] {
  return fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith(".md"))
    .map((f) => read<T>(`${dir}/${f}`))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export type Link = { label: string; href: string };

export type Site = {
  name: string;
  title: string;
  location: string;
  email: string;
  years: number;
  seoTitle: string;
  seoDescription: string;
  tagline: string;
  kicker: string;
  links: Link[];
  draft?: boolean;
};

export type Source = { id: string; label: string; domain: string; color: string };

export type Stage = {
  id: "intake" | "bronze" | "spark" | "silver" | "gold" | "orchestrator" | "sentinel";
  order: number;
  label: string;
  title: string;
  color: string;
  summary: string;
  project?: string;
  sources?: Source[];
  tasks?: string[];
  draft?: boolean;
};

export type Chaos = {
  id: string;
  order: number;
  label: string;
  stage: Stage["id"];
  severity: "warning" | "error";
  detect: string;
  diagnose: string;
  heal: string;
};

export type Module = {
  slug: string;
  order: number;
  kind: "product" | "case-study";
  codename: string;
  title: string;
  status: string;
  problem: string;
  diagram: string[];
  stack: string[];
  impact: { value: string; label: string };
  links: Link[];
  draft?: boolean;
};

export type Dial = { label: string; depth: number; years: number };
export type Instruments = {
  heading: string;
  intro: string;
  groups: { name: string; dials: Dial[] }[];
  draft?: boolean;
};

export type FlightEntry = {
  company: string;
  role: string;
  domain: string;
  start: string;
  end: string;
  location: string;
  lines: string[];
};
export type FlightLog = { heading: string; intro: string; entries: FlightEntry[]; draft?: boolean };

export type Engine = {
  heading: string;
  intro: string;
  greeting: string;
  suggestions: string[];
  persona: string;
  draft?: boolean;
};

export type Transmit = {
  heading: string;
  intro: string;
  email: string;
  button: string;
  success: string;
};

export const getSite = () => read<Site>("site.md");
export const getStages = () => readDir<Stage>("machine");
export const getChaos = () => readDir<Chaos>("chaos");
export const getModules = () => readDir<Module>("modules");
export const getModule = (slug: string) => getModules().find((m) => m.slug === slug);
export const getInstruments = () => read<Instruments>("instruments.md");
export const getFlightLog = () => read<FlightLog>("flight-log.md");
export const getEngine = () => read<Engine>("engine.md");
export const getTransmit = () => read<Transmit>("transmit.md");

/** Every content file as plain text: the knowledge base for Ask the Engine. */
export function getKnowledge(): { file: string; text: string }[] {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".md") && e.name !== "README.md" ? [path.join(dir, e.name)] : [],
    );
  return walk(ROOT).map((f) => ({ file: path.relative(process.cwd(), f), text: fs.readFileSync(f, "utf8") }));
}
