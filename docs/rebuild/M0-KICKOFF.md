# M0 Kickoff Prompt

Paste the prompt below verbatim into a fresh Claude Code session (Opus) to
start Milestone 0. It is written to be self-sufficient given this repo's
docs. Owner iterates on look/feel conversationally after the first pass.

---

Read `CLAUDE.md`, then `docs/rebuild/ARCHITECTURE.md`, `docs/rebuild/GAME-DESIGN.md`
(sections 1–5), and the M0 section of `docs/rebuild/ROADMAP.md` before writing
any code. `docs/rebuild/DECISIONS.md` is settled law — do not re-open ACCEPTED
rows. Follow `docs/rebuild/AGENT-GUIDE.md` for standards and the
screenshot-verify loop.

Your task is **Milestone M0: Engine & scaffold**, in this order:

1. Move all v2 code (`src/`, `api/`, v2 configs) into `legacy/` untouched.
   Do not spend any effort improving it (D-002).
2. Scaffold the v3 workspace per ARCHITECTURE: Next.js App Router,
   TypeScript `strict`, Tailwind, Vitest, Playwright, GitHub Actions CI
   gating typecheck + lint + unit + smoke. One lockfile (npm).
3. Build `packages/genome`: the Genome v1 schema from GAME-DESIGN §2 with
   zod validation, share normalization, per-slot effective-weight logic
   (pins are one-hot overrides), identity weights (D-014), the naming
   composer (§5), and stats.
4. Build `packages/species-data` with the three prototype species (T-Rex,
   Triceratops, Stegosaurus): morph vectors, feature genes, syllables,
   stats. Salvage facts from `legacy/src/data/dinosaurDatabase.ts`.
5. Build `packages/renderer` by porting the working prototype at
   `docs/rebuild/prototype/morphlab.html` (the `<script>` section contains
   the validated geometry: spine sampling, variable-width ribbon outline,
   continuity-corrected normals, feature threshold ramps, limb Catmull-Rom
   ribbons). Renderer is a pure function `renderCreature(genome) => string`
   — no DOM, no React, no I/O imports (CI-enforced invariant).
6. Golden-genome snapshot tests: ≥12 fixtures covering pure species, 2/3-way
   mixes, every part-slot pin, hatchling/juvenile age transforms, and size
   extremes. Same genome must yield an identical SVG string.
7. Build `/lab` in `apps/web`: DNA sliders (pool of 3 for now), part-pin
   selects, cosmetics (two colors + pattern), size + age controls, the
   placard (generated name, chips, stat meters), and a genome JSON viewer.
   State lives in one Zustand store holding the Genome object; undo/redo
   snapshots that one object.
8. Verify per AGENT-GUIDE: Playwright screenshots at slider extremes, every
   pin combination, both themes, and 375px mobile width. Attach before/after
   screenshots to the PR. Compare against `docs/rebuild/prototype/morphlab.html`
   rendered in a browser — M0's bar is parity or better.

Definition of done is the M0 section of ROADMAP.md. Visual design is yours
within the voice ("playful field-science" — see VISION.md tone notes); the
owner will iterate on styling with you afterward. Genome schema, renderer
purity, and determinism are not yours to change (ask first — see CLAUDE.md).

---

## Notes for the owner

- Run M0 in one session if possible; it's sized for that.
- After M0 lands, iterate look/feel conversationally ("make the placard feel
  more like a museum label", "warmer default palette") — that's all inside
  Opus latitude.
- M1 (the roster + adaptive parts picker + species workbench) gets its own
  kickoff prompt once M0 is merged; write it against ROADMAP's M1 section.
