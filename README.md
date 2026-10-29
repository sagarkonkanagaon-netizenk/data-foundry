# The Data Foundry

Sagar's portfolio: a live, self-healing medallion data machine.

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
5. Chaos injection + Sentinel healing
6. Sections polish (Modules, Instruments, Flight Log, Transmit)
7. Ask the Engine (RAG chat)
8. Live data feed
9. Performance, mobile, accessibility

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
