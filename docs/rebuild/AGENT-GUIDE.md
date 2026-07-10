# Createosaur v3 — Agent Operating Guide

How Claude Code sessions (any model) work in this repo. The owner iterates
by conversation; this guide keeps sessions consistent with each other.

## Session startup ritual

1. Read `CLAUDE.md` (root), then the `docs/rebuild/` doc relevant to your task.
2. Check `docs/rebuild/ROADMAP.md` for the current milestone and its
   **Definition of Done** — your task lives inside a milestone.
3. Check `docs/rebuild/DECISIONS.md` — if your task touches an OPEN row, ask
   the owner before building.

## The verify loop (non-negotiable for visual work)

The renderer's whole point is that output is inspectable. Never claim visual
work is done without looking at it:

1. Run the app (or render the SVG in a harness).
2. Screenshot with Playwright (`/opt/pw-browsers/chromium` is pre-installed
   in remote sessions; use `executablePath`, don't `playwright install`).
3. **Look at the screenshot.** Check: anatomy coherent at slider extremes,
   no clipped features, both themes, mobile width.
4. Iterate until it's right, then attach before/after screenshots to the PR.

This loop caught every real bug in the prototype session (twisted limb
ribbons, invisible meters, mislabeled weights). Budget for 2–3 rounds.

## Code standards

- TypeScript `strict: true` everywhere; no `any` in `packages/`.
- No `console.log` in shipped code — use the `debug` util (no-op in prod).
- One source of truth per concept: the v2 sin to never repeat is two prompt
  modules with lookalike exports (that's what broke production).
- Components small; the lab store is the only stateful hub. If a component
  needs 6+ `useState`s, the state belongs in the store.
- Comments explain constraints ("plates draw before the body so their bases
  hide under the silhouette"), not narration.
- Copy voice: playful field-science. "Omnivore (allegedly)" — yes.
  "Oopsie! Something went wrong 🥺" — never. Errors say what happened and
  what to do.

## Invariants (CI enforces; you must not work around)

1. **Determinism**: same genome → identical SVG. Golden-genome snapshots
   regenerate only in a dedicated commit with screenshots and a stated reason.
2. **Renderer purity**: no DOM/React/I-O imports in `packages/renderer`.
3. **Schema versioning**: never mutate the meaning of an existing genome
   field; add fields + bump version + write-migration.
4. **Package dependency direction** per ARCHITECTURE.
5. **No fabricated content**: no fake ratings, fake testimonials, fake
   paleontology. Playful fiction is fine when visually framed as fiction.

## Git & PR conventions

- Branch per milestone-task; PR to the integration branch the owner names.
- PR description: what changed, screenshots for anything visual, which
  ROADMAP item it advances, any DECISIONS rows touched.
- Commits: conventional-ish (`feat:`, `fix:`, `data:` for species vectors,
  `goldens:` for snapshot regeneration).

## Working with the owner

- The owner iterates on look/feel/copy freely — take that direction without
  re-litigating the docs.
- If owner direction *contradicts an ACCEPTED decision*, don't silently
  comply or silently refuse: name the conflict in one sentence and ask which
  wins. ("That would un-cap the gene pool (D-007) — want me to update the
  decision log?")
- Surface tradeoffs at decision time, not after building the wrong thing.

## The milestone review ritual

Every milestone gets an independent review pass before its PR merges (a
different session than the one that built it, any capable model). The
recipe, validated on M0 and M1:

1. **Gates**: `npm ci && npm run typecheck && npm run lint && npx vitest run
   && npm run build && npm run e2e` — all green or stop here.
2. **Invariant audit**: `git diff --name-status <base>..HEAD` — were any
   pre-existing goldens modified (needs a dedicated justified commit)? Was
   `packages/genome/src/types.ts` touched (needs owner approval)? Any
   committed scratch files?
3. **Facts audit**: diff every new/changed species field against
   `legacy/src/data/dinosaurDatabase.ts`. Invented paleontology is a
   hard-invariant violation.
4. **Visual pass**: render the new/changed goldens into a contact sheet
   (Playwright + the preinstalled Chromium) and *look* at them; screenshot
   the app states the milestone touched, both themes, mobile width.
5. **Adversarial workflow**: multi-agent finders per dimension
   (determinism, geometry, state logic, data quality, docs conformance,
   UI/a11y), every finding verified by independent skeptics before it's
   acted on. Fix confirmed findings; record notable ones in the PR.

## Definition of done, universally

Typecheck ✓ lint ✓ unit ✓ smoke ✓ — plus the verify-loop screenshots for
visual work, plus docs updated if behavior moved (GAME-DESIGN for mechanics,
DECISIONS for decisions, ROADMAP checkboxes for milestone progress).
