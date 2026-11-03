import type { Module } from "./content";

/** Codename colour: violet for production case studies, amber for open source, cyan for labs. */
export const kindAccent = (k: Module["kind"]) =>
  k === "case-study" ? "text-violet" : k === "open-source" ? "text-amber" : "text-cyan";
