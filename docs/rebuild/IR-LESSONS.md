# Illustrated Renderer — lessons learned & the socket era (D-024)

**Status: phase conclusion, owner-agreed 2026-07-23.** The IR probe phase
(IR0 → IR1 → hybrid PoC → D-021 parts-first probe) is CLOSED. This document
harvests what it proved, declares what is dead, and defines the authoring
contract for the next phase — the **socket era**. Dead experiments are
archived out of the working tree (git history keeps everything; the archived
files were last present at commit `457cd89`).

## What the product is aiming at (the owner's call)

Two candidate dreams were weighed explicitly:

- **Dream A — illustrated look with continuous cross-species morphing**
  (slide DNA, watch a trex torso *become* a brachio torso). **Killed.**
  Continuous shape interpolation between raster illustrations needs every
  species painted on a shared mesh topology with corrective blend shapes —
  a Live2D/Spine-grade studio pipeline. Not achievable here; not pursued.
- **Dream B — "Lego Jurassic World custom dino creator on steroids."**
  **This is the goal.** Discrete illustrated parts snapped across species
  (trex body + brachio neck + trike head), continuous *within-part* morphs
  from the deformation rig (neck curve/length, tail sway, bulk, breathing),
  and **runtime color & pattern choice**. The vector field-guide renderer
  (`/lab`) remains the production engine and fallback until the illustrated
  track passes its gate (D-020 unchanged); it is not the target look.

## Proven — build on these

- **Single-species master-cut rigs look right and animate.** `trex-r0-v2`
  and `allosaurus-r0-v2` (owner-approved on real devices) idle, breathe,
  look, stride and clench at `/rig-lab`, at full ±1 stride and full jaw
  clench. One coherent master image, cut in-repo, is a proven pipeline.
- **The closed-core z-contract kills motion holes.** The parts-first rig's
  enclosed-hole scan stayed flat across the whole pose sweep and *below*
  the master-cut baseline everywhere (98/85/102/100/57 vs 476/152/268/274/269)
  — a core with no openings can't gap at the limbs. The parts-over-core
  evaluator (`packages/illustrated-rig/src/parts.ts`) is kept for this reason.
- **Cross-pack junctions are motion-stable.** In every hybrid mix the scan
  is flat across the sweep: a junction that is closed at rest stays closed
  in motion. Junction quality is a *static* problem, which makes it an
  *authoring-contract* problem.
- **Piece → true-master normalization works, including across sheets.**
  Any sheet carrying the anchor + scale bar normalizes to master scale, so
  pieces from different images assemble in correct registration (the deep-
  neck splice proved it). The slicer (`tools/sheet-slicer`) and scan
  (`tools/rig-scan`) survive into the socket era.
- **Grayscale value generation works on request.** The neutral-value probe
  measured chroma ~2 (vs ~41 painted) with form shading, scales, eyes and
  teeth intact — and value can also be *derived* by desaturating painted
  art. The D-023 value half is proven.
- **Creature-is-data holds.** Genome, blend math, naming, stats, species DB
  and site are render-agnostic; swapping the picture layer is the plan
  working, not a restart.

## Dead — do not iterate on these again

- **Independently generated painted parts.** Assembling parts from
  separately generated *painted* images reads as a collage: each image
  bakes its own lighting and palette, and no crop/scale/warp tuning fixes
  that. Five probe rounds (r1–r5, including the multi-sheet deep-neck
  splice at its best) ended with owner-confirmed misses: mismatched neck
  wedge, double-jaw read, palette patchwork. The verdict is structural,
  not a tuning shortfall.
- **Mixing baked-color packs as a product look.** Even the best case —
  trex ↔ allosaurus, same archetype, harmonized masters — shows palette
  steps and aperture-mismatch slivers. Fine as the mechanism PoC it was;
  dead as the shipping look.
- **One crammed parts page.** A single sheet holding nine-plus pieces
  shortchanges the junction-critical ones (the r4 flat neck / no-cover
  head). Focused sheets only.
- **Polishing the parts-first collage.** The `trex-pf-r0` pack, its slice
  manifest, probe sheets and screenshots are archived; the slicer's
  capabilities (chroma key, keep/crop tables, multi-sheet, non-uniform
  scale, despill) carry forward.

## The two root causes (every failure above traces to these)

1. **Appearance is baked into the generated image** — its own light and
   palette — so any two images clash when assembled.
2. **Junction geometry is accidental** — part ends fall wherever that
   image happened to put them, so no two parts meet cleanly.

## The socket-era authoring contract (D-024)

Author images so neither root cause exists, instead of engineering it away
afterwards:

1. **Grayscale value art only.** Form shading, scales, eyes, teeth, claws —
   zero hue. Color, tone and pattern become a runtime pass (which is also
   the product's color/pattern picker — one build, two payoffs). Parts
   cannot color-clash by construction.
2. **Standard socket profiles, enforced by template.** Every part is
   generated ON a template sheet whose magenta guides fix the *cut size* of
   each part end (not its position — bodies place apertures naturally per
   species). Profiles v1, master-stage px: neck→body 180 · neck→head /
   head rear collar 110 · jaw root 70 · tail root 150 · leg root 130 ·
   arm root 55. Templates: `docs/rebuild/asset-generation/
   socket-template-{a,b}-v1.png`, generated by
   `tools/socket-template/make-template.mjs`. Near-compliance is enough —
   the slicer snaps small deviations; the template exists to prevent the
   *large* mismatches that read as gaps.
3. **One lighting contract.** Soft ambient, faint upper-left key, no cast
   shadows — so value art matches across sheets and species.
4. **Focused sheets.** Per species: sheet A (head assembly: upper head with
   rear cover, jaw, neck) + sheet B (closed core, tail, arms, legs).
   Traits/extras get their own sheets later. Never one crammed page.
5. **Closed core + parts drawn over it** — the proven z-contract, unchanged.

Prompts: `docs/rebuild/asset-generation/PROMPT-TEMPLATES.md` **Template S**.
Art register: default is clean stylized naturalism with simple two-step
shading (the Camp-Cretaceous register — more forgiving at junctions and
under runtime paint than painterly rendering); the owner judges the register
on the first returned sheet.

## The kill test (run BEFORE scaling to more species)

The unproven bet is **cross-archetype fit**: trex ↔ allosaurus was the
easiest possible pair and still seamed. So the first socket-era build is the
hard case, not the easy one:

1. T. rex authored to the contract (sheets A + B) and assembled.
2. **Triceratops** authored to the same contract (dissimilar archetype;
   the frill doubles as a natural neck-junction cover).
3. One cross-archetype hybrid (trike head on trex body and the reverse),
   runtime-painted, judged by the owner **as a hybrid** — not as two
   species that each look fine alone.

Pass → scale to the archetype exemplars (IR2). Fail after honest iteration
→ the illustrated-mixing track stops, having cost two species, not five.
Confidence, stated for the record: palette unification — very likely;
same-archetype geometry fit — likely; cross-archetype fit — genuinely
uncertain (that's why it goes first).

## Archived vs kept

**Archived** (removed from the working tree in the commit introducing this
file; last present at `457cd89`): the `trex-pf-r0` pack + its web wiring
and integrity tests, `tools/sheet-slicer/trex-pf-r0.slice.json`, all
`probe-*` sheets under `docs/rebuild/asset-generation/`, the parts-first
screenshot set `docs/rebuild/rig-lab/parts-first/`, and
`IR-SLICER-KICKOFF.md`.

**Kept**: the approved `trex-r0-v2` / `allosaurus-r0-v2` packs and the
hybrid PoC (mechanism reference at `/rig-lab`), the parts-over-core
evaluator (`parts.ts`, with `parts-defs.ts` as its test fixture),
`tools/sheet-slicer`, `tools/rig-scan`, `tools/rig-pack`,
`tools/socket-template`, the decision log, and the generation bible + this
contract. The product core (`/lab`, genome, renderer, species data) was
never touched by the probe phase.
