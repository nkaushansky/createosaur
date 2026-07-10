# Createosaur v3 — Roadmap

Milestones are sized for focused Claude Code sessions with owner iteration
between them. Each has a **Definition of Done** (objective) and **Latitude**
(where the implementing session may exercise taste without asking).

Sequencing rationale: prove the toy (M0–M1) → wire the growth loop (M2) →
persistence (M3) → retention (M4) → revenue (M5). Resist reordering; each
milestone's value depends on the previous one existing.

## ~~M-1 — Legacy triage~~ (SKIPPED per D-002)

Owner decided 2026-07-10: the live v2 site is left untouched — no triage, no
teaser. All effort goes to v3. (For the record, v2's known defects: broken
anonymous generation via a wrong-module import at `useGeneration.ts:93`,
fabricated `aggregateRating` JSON-LD, uncapped admin-key spend in
`api/anonymous-generate.js`.) Do not spend sessions improving `legacy/`.

## M0 — Engine & scaffold (the foundation session)

- Next.js scaffold per ARCHITECTURE (strict TS, workspace packages, CI gate).
- `packages/genome`: schema v1 + zod validation + blend math + identity
  weights + naming + stats.
- `packages/renderer`: port the Morph Lab prototype renderer (3 species:
  T-Rex, Triceratops, Stegosaurus) with parity or better.
- Golden-genome tests green; Playwright smoke green.
- Lab route with sliders, pins, cosmetics, placard — prototype parity in the
  real stack.

**DoD**: prototype parity at `/lab`, all invariant tests in CI, `legacy/`
move complete, deploy previews working.
**Latitude**: all styling/layout; component architecture; animation.

## M1 — The roster (the content milestone)

- Species workbench (dev route) for authoring morph vectors.
- Author the v1 terrestrial roster in waves: 6 → 12 → 20+ species, each wave
  shippable. First exemplar per archetype (sauropod, ornithopod, armored,
  ceratopsian, theropod) gets extra care — later species tune from exemplars.
- Feature-gene variants: horns (1/3), frills (2 sizes), plates, spikes, sail
  (Spinosaurus!), crests (Parasaurolophus/Dilophosaurus), dome (Pachy),
  club (Ankylosaurus), feathers (raptors).
- Species browser (era/diet/size filters) feeding the gene pool; pool cap 4.
- Parts picker v1: pool-derived options, rendered vignettes, Blend-first,
  pin-clearing rules per GAME-DESIGN §4.

**DoD**: ≥12 species live with picker vignettes; every pairwise mix of the
archetype exemplars renders without anatomical breakage (golden fixtures
cover these); species browser shipped.
**Latitude**: picker UI form (panel vs tap-on-creature vs both); browser
layout; which species make each wave (exemplars fixed).

## M2 — Share & remix (the growth loop)

- Creature pages `/c/:id` (server-rendered), OG image = the creature.
- Save-and-share for anonymous users (claim tokens per ARCHITECTURE).
- Remix button → genome loads into lab; credit chain on creature pages.
- Placard fact drawer (real species facts, bus-for-scale).

**DoD**: a shared link unfurls with the creature as its card in
iMessage/Discord/Slack; remix round-trip works logged-out; remix counter and
credit render.
**Latitude**: share card composition, page layout, fact drawer presentation.

## M3 — Accounts & the dex

- Supabase auth (parent-framed), local→cloud merge on first sign-in.
- My Creatures gallery + public profile pages (opt-in public).
- Rename with filter; favorites.

**DoD**: creature made anonymously on phone → claimed → visible on laptop.
**Latitude**: gallery design entirely.

## M4 — Breeding, lineage, Saurdex (the retention layer)

- Cross + mutation + atavism per GAME-DESIGN §6 (rates are data/flags).
- Egg flow (instant-hatch flag first, timed later).
- Family tree on creature pages; Saurdex collection screens.
- "Loose parts" progression hook into the picker.

**DoD**: breed two creatures → child inherits per spec, lineage renders,
atavism reachable in seeded tests; dex tracks discovery.
**Latitude**: egg/hatch presentation, dex visual design, exact atavism odds
(within owner-approved rarity bands).

## M5 — AI portraits & monetization

- img2img portrait pipeline per ARCHITECTURE; credits + global budget
  breaker from day one; Stripe checkout for credit packs.
- Portrait gallery on creature pages.

**DoD**: portrait visibly matches its creature (silhouette/parts/palette);
zero-credit path is graceful; budget breaker tested; owner has done a real
purchase in test mode.
**Latitude**: portrait styles offered; gallery UX. **No latitude**: pricing,
credit amounts, budget caps — owner decisions.

## M6+ — Expansions (backlog, unordered)

Marine pack (Mosasaurus returns, waterline environment) · flyers pack ·
environment/biome scenes · viability report ("would it survive the
Maastrichtian?") · classroom mode · seasonal events · battle mode
(only if D-011 ever flips).
