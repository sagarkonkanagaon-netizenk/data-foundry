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
2. Static machine geometry + glass shaders
3. Particle flow
4. HUD + state + simulated metrics
5. Chaos injection + Sentinel healing
6. Sections polish (Modules, Instruments, Flight Log, Transmit)
7. Ask the Engine (RAG chat)
8. Live data feed
9. Performance, mobile, accessibility
