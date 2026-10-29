# The Data Foundry

Sagar's portfolio: a live, self-healing medallion data machine.

**Live site:** https://data-foundry-sand.vercel.app

```bash
npm install
npm run dev        # http://localhost:3000
```

**Edit text in `/content`, not in code.** See `content/README.md` for the map of
which file drives which part of the site.

## Layout

- `content/` – all copy, as markdown with YAML frontmatter
- `lib/content.ts` – the only code that reads `/content`; typed loaders
- `app/` – Next.js App Router pages (`/` and `/modules/[slug]`)
- `components/Schematic.tsx` – SVG machine; poster frame and no-WebGL fallback
- `components/sections/` – page sections

## Build plan

1. Scaffold + content ✅
2. Static machine geometry + glass shaders ✅
3. Particle flow ✅
4. HUD + state + simulated metrics ✅
5. Chaos injection + Sentinel healing ✅
6. Scroll tour + sections (Modules, Instruments, Flight Log, Transmit) ✅
7. Ask the Engine (RAG chat) ✅
8. Live data feed ✅
9. Performance, mobile, accessibility ✅

## The machine (`components/machine/`)

- `MachineLoader.tsx` – detects WebGL2 / reduced motion / weak devices, lazy-loads the
  scene and cross-fades it over the SVG schematic
- `Scene.tsx` – canvas, studio lighting (Lightformers), camera rig, postprocessing
- `Glass.tsx` – shared refraction buffer + `GlassVessel` (transmission, fresnel rim, caustics)
- `Chambers.tsx`, `SparkCore.tsx`, `Plumbing.tsx`, `Orchestrator.tsx`, `Sentinel.tsx`, `Atmosphere.tsx`
- `shaders/` – custom GLSL: fresnel rim + scan band, caustics, scan beam, hologram tiles, dust, backdrop fog, glow
- `layout.ts` – world positions and palette
- `geometry.ts` – shared shapes (intake curves, rings, lattice, Gold columns) and live transforms the flow reads
- `flow/sim.ts` – the record journey as a pure function of (record, time); `flow/payload.ts` – fake JSON per source
- `Particles.tsx` – one Points draw call for every record, hover to inspect; `ShuffleArcs.tsx` – Spark shuffle arcs

## Simulation and state

- `workers/sim.worker.ts` – runs off the main thread: telemetry at 4Hz and the particle
  flow (buffers ping-pong between the main thread and the worker each frame). It is
  bundled by esbuild to `public/sim.worker.js` (`npm run worker`, run automatically
  before `dev` and `build`).
- `lib/machine/metrics.ts` – mean-reverting telemetry and the DAG run cycle
- `lib/machine/store.ts` – Zustand store: metrics, history for sparklines, DAG task states,
  active stages. 3D parts read it inside `useFrame` (no re-renders).
- `components/Hud.tsx` – the telemetry strip and run line; plain DOM, so it works without WebGL

## Chaos and the Sentinel

- `lib/machine/chaos.ts` – the incident timeline (inject → detect → diagnose → heal →
  recovered) and the `fault` / `repair` curves every reacting part reads
- `components/Chaos.tsx` – INJECT CHAOS buttons, the incident report card, and the
  director that ticks the clock and tells the telemetry sim
- Failures live in `flow/sim.ts` (`applyChaos`), `metrics.ts` (numbers), `Glass.tsx`
  (rims burn amber/red), `SparkCore.tsx` (hot executor) and `Plumbing.tsx` (dead ports)
- The log lines and narration come from `content/chaos/*.md`, so the story is editable

## Scroll tour and sections

- `lib/machine/tour.ts` – camera shots for each stage; `components/Tour.tsx` turns page
  scroll into tour progress and renders a glass caption per stage. Clicking a chamber
  (`components/machine/Hitboxes.tsx`) scrolls to its caption.
- Modules dock along a spine. Each capsule has a live 3D scene
  (`components/modules/scenes.tsx`) chosen by `scene:` in its markdown. All scenes draw
  into one shared, fixed canvas through drei `<View>`, so seven scenes cost one WebGL
  context, and the canvas only mounts while the section is near the viewport.
- `components/Reveal.tsx` – scroll reveals (gauge needles, flight log entries).
- Transmit posts to `app/api/transmit/route.ts`, which emails through Resend.
  Set `RESEND_API_KEY` in Vercel (and optionally `TRANSMIT_FROM` with a verified
  sender). Without a key the form opens the visitor's mail app instead. It has a
  honeypot field and a per-IP limit of 5 messages an hour.

## Ask the Engine

- `lib/engine/retrieve.ts` splits every file in `/content` into short passages and
  ranks them per question with BM25 (the site overview and the extra facts in
  `content/engine.md` are always included). Edit the markdown and the engine knows.
- `app/api/engine/route.ts` sends the top passages and the last few chat turns to
  Claude and streams the answer back as plain text. The key is `ANTHROPIC_API_KEY`
  in Vercel and never reaches the browser. `ENGINE_MODEL` overrides the model
  (default `claude-opus-5-5` at low effort, answers capped at 2,000 tokens, with
  server-side fallback on a refusal).
- Limits: 12 questions per IP per 10 minutes and 400 per server instance per day,
  questions up to 600 characters. These are in memory and reset on cold start, so
  also set a monthly spend limit in the Anthropic Console.
- Free option: set `GEMINI_API_KEY` instead (free key from
  https://aistudio.google.com/apikey). It is used only when `ANTHROPIC_API_KEY` is not
  set; `GEMINI_MODEL` overrides the default `gemini-2.5-flash`. The free tier has its
  own per-minute and per-day quotas, and Google may use free-tier prompts to improve
  its models, which is fine here since the prompts are public site content plus the
  visitor's question.
- Without either key the console says it is offline and shows the contact email.

## Live data

- `lib/machine/feed.ts` subscribes to Wikimedia's public `recentchange` event stream
  (every edit on every Wikipedia, ~20-60 a second) with the browser's `EventSource`.
  No key or server needed.
- A data contract decides what passes: edits and new pages need a title, a revision id
  and a byte length; log events fail it and count as quarantined. Category bookkeeping
  events are filtered out at the source.
- While live, the HUD shows real numbers: events/sec, ingest lag p95 (now minus the
  event's own timestamp), seconds since the last event and the contract pass rate.
  Cost is still simulated and labelled so. Chaos injection works on live data too.
- Hovering a particle shows a real recent event (a failing one for a red particle).
- The switch above INJECT CHAOS flips between live and simulated. If the stream can't
  connect or goes quiet for 8s, the machine falls back to simulated sources and retries
  (5s, 15s, 30s, 60s, then every 2 min). The stream closes in background tabs and when
  the browser asks to save data.
- `NEXT_PUBLIC_LIVE_FEED_URL` overrides the stream URL (used for local testing).

## Devices, performance and SEO

- `lib/gpu.ts` picks a version of the machine per device: the full 3D machine on
  desktops with a real GPU (without post effects on modest ones), a **2.5D machine** on
  phones, with data saver and on software-rendered WebGL, and the still schematic with
  reduced motion or no WebGL. Phone visitors can tap **Load 3D**; the choice is remembered.
- `?render=3d`, `?render=2.5d` or `?render=static` forces a version, for checking each
  one on a single machine.
- The 2.5D machine (`components/machine/Machine25D.tsx`) stacks the schematic's depth
  layers in CSS 3D, runs records through the conduits, flies the same scroll tour and
  reacts to injected chaos with the Sentinel's beam. No WebGL.
- In 3D, a frame-rate governor sheds post effects, then resolution, below 45 fps, earns
  resolution back with headroom, and switches to 2.5D if the scene stays under 14 fps.
  The 3D chunk loads only once the browser is idle after first paint.
- Accessibility: skip link, visible focus rings, ordered headings, text alternatives for
  every version of the machine, and all motion off with reduced motion.
- SEO: canonical URLs, an Open Graph card (`app/opengraph-image.tsx`), `sitemap.xml`,
  `robots.txt` and JSON-LD for the profile. Set `NEXT_PUBLIC_SITE_URL` when a custom
  domain goes live; until then the Vercel production URL is used.
- Links in `content/site.md` that still point at a placeholder or at a file missing from
  `/public` (like `/resume.pdf`) are hidden until they're real.
- Lighthouse (local production build): mobile 95 performance, 100 accessibility,
  100 SEO; desktop 100 / 100 / 100. Best practices reads 96 here only because this
  sandbox blocks the Wikimedia stream.
