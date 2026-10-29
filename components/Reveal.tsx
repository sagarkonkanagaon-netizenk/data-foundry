"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** Marks its element with data-in the first time it scrolls into view. CSS does the rest. */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "article" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.setAttribute("data-in", "");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} data-reveal="" className={className} style={{ ["--delay" as string]: `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
