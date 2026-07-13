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
move complete, static export (`apps/web/out/`) builds and serves — that
folder IS the deployable per D-016.
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

**Shipped** (roster 3 → 12): species workbench (`/workbench`, dev-only),
`renderPart` vignettes, and five new feature genes (sail, crest, domeSkull,
tailClub, feathers). Nine new species — Brachiosaurus (sauropod exemplar),
Parasaurolophus (ornithopod exemplar), Ankylosaurus, Spinosaurus,
Velociraptor, Dracorex, and Allosaurus, Diplodocus (whip-tail sauropod, the
counterpoint to Brachiosaurus), Iguanodon. Dracorex is the pachycephalosaurid
in the salvaged database; it fills the head-butter slot because
Pachycephalosaurus is not in `dinosaurDatabase.ts` and facts are never
invented — **sourcing Pachycephalosaurus facts is the prerequisite to adding
it** (the `domeSkull` feature is already built). Species browser
(period/diet/size) + vignette parts picker + pool add/remove with undo toast
shipped (swap exists at the store level with tests but has no UI yet — wire
it or drop it in a later pass; if wired, it must gain the pin-clear undo
toast per GAME-DESIGN §4). Every pairwise mix of the five archetype exemplars has a
golden fixture. DoD met (≥12 species, picker vignettes, pairwise coherence,
browser). **Planned next — the fidelity pass** (required before the DNS
cutover / public launch, D-018). Owner art direction, 2026-07-10:
**"Camp Cretaceous cartoony-realistic-esque, or at least a more detailed
field-guide drawing — not Jurassic Park photoreal."** Concretely: interior
contour/muscle linework, two-tone or gradient shading for volume, organic
sail curve with spine rays (not a hard polygon), feathers as a layered coat
(not quill spikes), tail club as a textured knob, more deliberate eye/brow
treatment, varied outline weight. Stay inside the 2D field-guide brand.
Cross-cutting → regenerates all goldens, so it lands as a dedicated
goldens-regeneration commit with before/after screenshots per AGENT-GUIDE.
**Shipped (M1b)**: fidelity pass per the direction above — spine-following
contour/muscle linework; gradient volume (body/limb ramps + belly-shadow and
dorsal-light bands that follow the spine); organic scalloped sail with
neural-spine rays; feathers as a layered coat (fringe band + separation
strokes, nape tuft, tail fan, arm fringe); two-lobed textured tail club;
sculpted frill (epoccipitals + spokes); plate veins; horn growth rings;
eye/brow/catchlight + nostril treatment; varied outline weights; low-density
integument texture by skin-slot archetype (scale stipple / osteoderm courses
/ broad sauropod scales). Fixed the domeSkull cap arc (bulged over the face,
not the crown). New `RenderOptions.detail: 'fast'` tier skips fine-stroke
layers for weak hardware; vignettes stay `'full'` (the skin slot exists to
show integument). All 105 goldens regenerated in a dedicated commit;
before/after contact sheets live in `docs/rebuild/fidelity/`.
**Anatomy pass (owner feedback on the derp, 2026-07-12)**: parametric skull
(cranium/brow-boss/bridge, upper+lower jaw, carnivore gape with teeth on both
jaws, herbivore beak by snoutTip, socketed eye) stitched into the silhouette;
jointed limbs whose thighs merge into the body (root overpaint under the
silhouette clip — no more pinned-cutout cap lines); three-toed clawed feet,
two-clawed theropod hands. All head features re-anchor to the authored skull.
Same morph params, no schema change; goldens regenerated again.

**Planned next — M1c, the style-bible pass** (gates D-018; spec + decision:
`STYLE-BIBLE.md` + D-019, owner-decided 2026-07-13 after close-zoom review of
M1b found the procedural passes at diminishing returns). One renderer pass,
no schema change, no authored/commissioned art:

- Value system: flip to pigment countershading (dark dorsal → cream belly),
  wrap light, core-shadow band, AO pools at limb roots/jaw/tail — gradients
  only, no SVG filters in the per-tick path (STYLE-BIBLE §3).
- Line system: retire the hard black outline for self-toned edge + rim-shadow
  band; interior linework drops to a whisper (§3).
- Face: ratio table + per-archetype skull notes, lip-overhang tooth tips (no
  muppet picket row), post-scale feature floors + smooth simplified-tier fade
  for small heads — the brachiosaurus fix (§4).
- Limbs: archetype posture table (sauropod/armored columns — S-curve is
  theropod/ornithopod only), unified leg+foot silhouette, gradient-continuity
  at junctions, far-limb belly-line rule (§5).
- Dorsal dapple + grain addenda (§7).

**DoD**: the STYLE-BIBLE §2 acceptance ritual passes — every pure species at
full-frame max size, all archetype pairwise mixes, hatchlings, both themes,
checklist all-green, Chromebook element budget held; goldens regenerated in a
dedicated commit; contact sheets in the PR. D-018 cutover unblocks when this
lands.
**Latitude**: any tuning inside the bible's stated ranges; paint-order and
implementation details. **No latitude**: bible numbers themselves (owner
redlines only), invariants, schema.

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

- Self-hosted magic-link email auth per ARCHITECTURE (parent-framed);
  local→cloud merge on first sign-in. (Fallback if magic-link proves heavy:
  Supabase for auth only — see D-016.)
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
- Per D-019 the portrait is the product's **realism layer**: the
  Paul-grade/Camp-Cretaceous finish the live vector morph deliberately does
  not attempt. Style brief = STYLE-BIBLE §1 register at full painterly
  quality; portraits are outputs, never tracing bases (ART-REFERENCES rails).
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
