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

**Shipped (M1c)**: the style-bible pass per the spec above. Value system:
flipped half-strength countershade (spine-relative via the band machinery,
with an undulating dorsal pigment margin), wrap light, stepped core shadow,
AO pools at limb roots/throat/tail; line system: self-toned 1.2 silhouette +
clipped rim-shadow band, whispered interior lines. Face per §4 ratios with
post-scale floors and the 22→26 simplified-tier fade (armored heads stay
simplified); carnivores hold the narrow lip-overhang gape with bone-toned
tip teeth. Limbs per the §5 posture table (columns vs S-curves blended from
stance-slot weights), unified leg+foot silhouettes with posture-morphing
claws/nails, exact gradient continuity at attachment rows, per-foot contact
shadows. Dorsal dapple + belly-fading patterns per §7. `fitScale` now clamps
horizontally too, so max-size sauropods/clubs stay in frame (§2 bar). A new
budget test enforces §2's ≤300/≤180-element and no-`<filter>` rules in CI.
Contact sheets: `docs/rebuild/style-bible/`. All 105 goldens regenerated in
a dedicated commit.

## Illustrated Renderer Track (IR0 / IR1 / IR2)

A parallel renderer experiment recorded by D-020 (supersedes D-019's
procedural-only restriction). This track is named IR0/IR1/IR2 so it does not
collide with the product milestones M0/M1/M2. It runs beside the product
milestones; the procedural SVG renderer stays the production path until the
owner accepts the interactive result.

### IR0 — One playable illustrated T. rex

- exact approved authored T. rex layer pack;
- deterministic pose evaluator;
- `/rig-lab` parallel route;
- torso/neck mesh deformation;
- head/jaw/limb transforms;
- solid, mottle and band patterns;
- fixed-time screenshots and debug overlays.

**DoD:** the owner approves neutral, breathing, look, stride, stress and pattern
states; no obvious seam openings at stated ranges; patterns stay registered;
static export, typecheck, lint, unit, build and e2e pass; `/lab`,
`packages/renderer`, genome schema and SVG goldens are unchanged.

**Non-goals:** production cutover, hybrid anatomy, additional species, share
rendering, genome integration, Triceratops traits.

**Shipped (2026-07-20, PR #8):** owner approved the interactive result after
real-device review and merged. Live at `/rig-lab` (unlinked, noindex).
Notable scope note from the seam rounds: stride is capped at ±0.6 — the
`trex-r0-v1` pack's seam-clean envelope; the pack-revision slice rules that
restore full range are recorded in `docs/rebuild/rig-lab/README.md` and
`docs/rebuild/asset-generation/REPO-ADDENDUM.md`.

### IR1 — Theropod family

T. rex, Allosaurus, Velociraptor and Spinosaurus using a shared theropod rig,
after IR0 approval. Asset production follows
`docs/rebuild/asset-generation/` (the owner-approved generation bible plus
the repo addendum's technical contract).

**In progress (2026-07-21):** the rig is species-parameterized — one shared
pose evaluator reads a per-species `SpeciesRigDef` (pivots, deform constants,
stride bound, pack identity), and the T. rex refactor is proven bit-identical
by its unregenerated pose snapshot. Allosaurus is live at
`/rig-lab?species=allosaurus` (owner-approved `allosaurus-r0-v1` cut, PR #10)
and its seam rounds **verified the full ±1 stride range** — the enclosed-hole
scan stays flat across the whole sweep, confirming IR0's cap was the trex
pack's straight cut edges, not the approach. New-pack learning recorded in
the repo addendum: bottom-of-z-stack layers (far leg) cannot be backed by
overlap, so knee counter-rotation must stay small and pivot on the visible
thigh/shank seam.

**Jaw articulation (owner decision 2026-07-21):** masters are now generated
with a **partially open mouth** (addendum §1) so the jaw axis can really
close — the rig clenches an open mouth into hidden overlap, but can never
open a sealed one. **Shipped as `trex-r0-v2` / `allosaurus-r0-v2`:** both
species re-mastered to the spec (owner-approved), cut in-repo with a
per-tooth mouth boundary (upper fangs on the head, lower row + interior
floor on the jaw, jaw drawn under the head for correct occlusion), and both
verified at **full ±1 stride + full −8° clench** — neutral is the painted
open pose, so `jawRange` is [−8, 0]. Velociraptor onward uses the spec from
the first generation.

**Known limitation (owner-reviewed 2026-07-21, deferred):** at stride
extremes the hip/thigh piece boundaries read as visible seams — the legs
move as rigid cutouts, so the join lines show where they rotate out of the
body. The owner judged this non-critical: the walk motion is a rigging
showcase, not the product's core loop (mixing creature parts is). The real
fix is promoting the hip junction to weighted mesh deformation — the same
technique that makes the neck bend read as smooth and continuous — i.e.
skinned joint blending rather than deeper cut tuning, which hit diminishing
returns. IR2-class work; revisit when joints become product-visible.

**Hybrid mixing PoC (2026-07-22):** cross-pack part swapping is live at
`/rig-lab` ("Hybrid mix (PoC)" in the rig picker; deep link
`?mix=body:trex,head:allosaurus`). One shared mechanism over the twelve
layer slots: part groups (body = torso/neck/pelvis + motion program + seed;
head, arms, legs, tail swappable) carried between packs by pure-translation
anchors — head by *cover* (donor rear edge on base rear edge, so the base
neck's cut stays concealed; pivot alignment left a paper gap), arms by
shoulders, legs by hip-x + **ground-contact-y** (the packs stand ~35 px
apart; feet must plant), tail by root pivot. Donor parts keep their own
pivots and seam-tuned amplitudes; the base body's fields drive them
(`evaluateHybridRigPose` in `packages/illustrated-rig`; a pure config is
bit-identical to the species evaluator). The enclosed-hole scan — now
committed as `tools/rig-scan/` — shows every mix flat across the pose
sweep: cross-pack junctions are static, nothing opens with motion. Review
matrix + measurements + findings: `docs/rebuild/rig-lab/hybrid/`. Key
limits for IR2 (attachment rules): packs donate only what their master
painted (the mostly-occluded Allosaurus far leg cannot fill the T. rex's
far-leg opening), slim donors leave base-opening slivers (Allosaurus tail
on T. rex pelvis), and junction palette steps argue for harmonized masters.

### IR2 — One rig per terrestrial archetype

Theropod, sauropod, ceratopsian, armored and ornithopod exemplars, followed by
cross-archetype attachment and dominant-body rules.

Do not schedule IR1 or IR2 as active work until IR0 passes.

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
