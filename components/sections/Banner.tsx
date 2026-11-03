// A cinematic band between the playbook and the modules: the foundry rendered in 3D,
// looping. It is a pre-rendered video, so it looks the same on every phone and laptop
// and costs no WebGL. Visitors who prefer reduced motion get the still frame.
export function Banner() {
  return (
    <section
      aria-label="The foundry at work"
      className="relative isolate overflow-hidden border-y border-line"
    >
      <div
        className="relative aspect-[16/7] w-full bg-void bg-cover bg-center md:aspect-[16/5]"
        style={{ backgroundImage: "url(/brand/foundry-strip.jpg)" }}
      >
        <video
          className="banner-video absolute inset-0 h-full w-full object-cover"
          src="/brand/foundry-strip.mp4"
          poster="/brand/foundry-strip.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-void/30 via-void/0 to-void/80 md:block"
        />
      </div>
      <div className="px-6 py-6 md:absolute md:right-12 md:bottom-12 md:max-w-xs md:p-0 md:text-right">
        <div className="flex items-center gap-3 font-mono text-[10px] md:justify-end tracking-[0.3em] text-mute uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_#7fd8ff]" />
          The foundry at work
        </div>
        <p className="mt-3 text-xl font-light text-ink md:text-3xl">
          Raw records in. Clean, trusted data out.
        </p>
      </div>
    </section>
  );
}
