# Createosaur v3 🦖

An instant, deterministic dinosaur-mixing toy. Mix DNA across species with
sliders, pin parts Lego-style, and watch the creature morph live — every
pixel a pure function of a ~1 KB genome.

**Design authority lives in [`docs/rebuild/`](docs/rebuild/).** Agents: read
[`CLAUDE.md`](CLAUDE.md) first.

## Layout

```
apps/web/               Next.js app (the lab)
packages/species-data/  Species facts, morph vectors, feature genes
packages/genome/        Genome schema, blending, naming, stats
packages/renderer/      genome → SVG. Pure TS, no DOM.
docs/rebuild/           Vision, game design, architecture, roadmap, decisions
legacy/                 Frozen v2 site (createosaur.com) — do not develop here
```

## Commands

```bash
npm install        # once, at the root
npm run dev        # lab at http://localhost:3000
npm run test       # unit + golden-genome snapshots
npm run typecheck  # strict TS across workspaces
npm run e2e        # Playwright smoke (requires npm run build first)
```

## The invariant

Same genome (including seed) → identical SVG, everywhere: browser, edge
function, test runner. Golden snapshots in `packages/renderer` enforce it.
