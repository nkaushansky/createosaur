# Createosaur — Agent Entry Point

## Project status (read this first)

This repo currently contains **two generations** of Createosaur:

1. **Legacy v2** (everything under `src/`, `api/`) — the live Vite SPA at
   createosaur.com. It is in maintenance mode: critical fixes only, no new
   features. Known issues are catalogued in `docs/rebuild/DECISIONS.md` (D-001).
2. **v3 rebuild** (planned, docs-first) — a ground-up rebuild around a
   deterministic "genome → creature" engine. **All design authority lives in
   `docs/rebuild/`.** Do not improvise product direction; it has been decided
   deliberately with the owner.

## Before writing any v3 code

Read, in order:

1. `docs/rebuild/VISION.md` — what we're building, for whom, and what we're NOT building
2. `docs/rebuild/GAME-DESIGN.md` — genome spec, morphing mechanics, parts picker, breeding
3. `docs/rebuild/ARCHITECTURE.md` — stack, repo layout, data model, pipelines
4. `docs/rebuild/ROADMAP.md` — current milestone, definition of done, your latitude
5. `docs/rebuild/AGENT-GUIDE.md` — coding standards, invariants, and the verify loop

## The one-paragraph summary

Createosaur v3 is an instant, deterministic dinosaur-mixing toy. A creature is
a small JSON **genome** (DNA weights over species + part pins + cosmetics), and
everything — the on-screen SVG, the share card, the stats, the name — is a pure
function of that genome. AI image generation is a *finishing* step layered on
top of the deterministic render, never the core loop. Breeding and collection
mechanics operate on genome data.

## Hard invariants (violating these is a bug, not a style choice)

- Same genome (including seed) → pixel-identical render. Golden-genome
  snapshot tests enforce this; never regenerate snapshots casually.
- The renderer stays pure TypeScript with zero DOM dependencies (it must run
  server-side in the self-hosted share service for OG images).
- TypeScript `strict: true`. No `any` in `packages/`. No `console.log` in
  shipped code.
- Never invent species facts — the species database is the single source of
  paleontology truth.

## Where you have latitude vs. where you don't

- **Free to change**: visual styling, layout, copy phrasing (keep the voice:
  playful field-science, never babyish), animation polish, component structure.
- **Ask the owner first**: genome schema changes, monetization, data
  collection/analytics, anything affecting children's privacy, new
  third-party services.
