"use client";

import { useEffect } from "react";
import { tour, CAPTION_SIDE } from "@/lib/machine/tour";
import type { Module, Stage } from "@/lib/content";

/**
 * Turns page scroll into tour progress. Writes `tour.u` for the camera and two CSS
 * variables on the stage container: --hero (1 → 0 as the hero UI fades) and --tour.
 */
export function ScrollTracker({ targetId, blocks }: { targetId: string; blocks: number }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const scrolled = -el.getBoundingClientRect().top;
      const u = Math.min(blocks, Math.max(0, scrolled / vh));
      tour.u = u;
      el.style.setProperty("--hero", String(Math.max(0, 1 - u * 2.2)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [targetId, blocks]);
  return null;
}

type WithHtml<T> = T & { html: string };

/** One full-viewport block per stage; its glass caption sits beside the chamber the camera is framing. */
export function TourBlocks({ intro, stages, modules }: { intro: string; stages: WithHtml<Stage>[]; modules: Module[] }) {
  return (
    <div className="pointer-events-none relative z-10">
      <section id="machine" className="flex min-h-svh items-center px-6 md:px-12">
        <div className="pointer-events-auto mx-auto max-w-2xl rounded-lg border border-line bg-void/55 p-8 backdrop-blur-xl md:p-10">
          <p className="mb-5 font-mono text-[10px] tracking-[0.3em] text-cyan/70 uppercase">§01 · How to read the machine</p>
          <div className="prose-foundry text-lg" dangerouslySetInnerHTML={{ __html: intro }} />
          <p className="mt-6 font-mono text-[10px] tracking-[0.25em] text-mute uppercase">↓ Scroll to fly through it · or click any chamber</p>
        </div>
      </section>
      {stages.map((s) => {
        const p = modules.find((m) => m.slug === s.project);
        const right = CAPTION_SIDE[s.id] === "right";
        return (
          <section key={s.id} id={`tour-${s.id}`} className={`flex min-h-svh items-center px-6 md:px-12 ${right ? "md:justify-end" : "md:justify-start"}`}>
            <article className="pointer-events-auto w-full max-w-md rounded-lg border border-line bg-void/60 p-7 backdrop-blur-xl md:p-8" style={{ boxShadow: `inset 0 1px 0 0 ${s.color}33` }}>
              <div className="font-mono text-[10px] tracking-[0.28em] uppercase" style={{ color: s.color }}>
                {s.label}
              </div>
              <h3 className="mt-3 text-3xl font-light tracking-tight">{s.title}</h3>
              <p className="mt-2 mb-5 text-mute">{s.summary}</p>
              <div className="prose-foundry text-[15px]" dangerouslySetInnerHTML={{ __html: s.html }} />
              {p && (
                <a href={`/modules/${p.slug}`} className="group mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
                  <span>
                    <span className="block font-mono text-[9px] tracking-[0.25em] text-mute uppercase">Built it · {p.codename}</span>
                    <span className="mt-1 block text-sm text-ink group-hover:text-cyan">{p.title}</span>
                  </span>
                  <span className="text-cyan transition-transform group-hover:translate-x-1">→</span>
                </a>
              )}
            </article>
          </section>
        );
      })}
    </div>
  );
}

/** Jump the tour to a stage (used when a chamber is clicked). */
export function flyTo(stage: string) {
  document.getElementById(`tour-${stage}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
