"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The banner's loop, fetched only when the band nears the viewport, and never with
 * reduced motion or data saver. Until then (or instead) the poster frame shows, so the
 * ~1 MB video never competes with the first screen.
 */
export function BannerVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (!el || nav.connection?.saveData || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="banner-video absolute inset-0 h-full w-full object-cover"
      src={load ? src : undefined}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
    />
  );
}
