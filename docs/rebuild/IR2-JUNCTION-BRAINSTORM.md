# IR2 pre-design — getting morph-smoothness back at the part junctions

Status: **brainstorm on the record** (owner ↔ Fable conversation, 2026-07-22,
after the IR1 hybrid mixing PoC). Nothing here is authorized to build except
the listed experiments; the decisions land in `DECISIONS.md` D-021…D-023.
Read with `docs/rebuild/rig-lab/hybrid/README.md` (the PoC findings this
reacts to) open.

## 1. Why v2 morphing was smooth, and why the current cut breaks

v2 had two unification points downstream of everything else:

1. **Geometry** — the body was always one complete silhouette; parts
   overlaid it and masked into it. Nothing could gap, because behind every
   part was more body.
2. **Appearance** — color/shade/pattern were applied after assembly, over
   the whole creature in one pass. Two paint jobs never met at an edge.

The IR pack cut inverts both. Exact-master reassembly means the torso ships
with **arm- and leg-shaped holes** — parts don't sit on the body, they
*complete* it. Every hybrid swap is a negative-space transplant: donor art
must exactly fill an opening shaped for a different animal, painted in a
different palette. The PoC measured the three resulting failure classes:

| Class | Mechanism | PoC evidence |
|---|---|---|
| Uncovered opening | donor art smaller than the base's hole → paper | Allosaurus far leg (96 % occluded in its own master) on T. rex |
| Contour mismatch | donor silhouette ≠ opening contour → steps/wedges | Allosaurus tail root on T. rex pelvis; haunch wedge |
| Paint discontinuity | two baked palettes/textures meet at a hard line | every junction, both directions |

Motion is *not* a failure class: the enclosed-hole scan is flat across the
pose sweep — junctions are static. Whatever fixes the rest pose fixes the
creature.

## 2. Parts-first generation (owner proposal, 2026-07-22)

Instead of painting a complete animal and cutting it apart, have the
generator produce each species as a **contact sheet of separated parts** —
head, torso/neck/pelvis core, both arms, both legs, tail — each drawn
complete, in one image, in the species' approved style. Slicing becomes
"segment separated items on a sheet," not "cut against a finished body."
We're not morphing parts into each other anymore; we're Lego-snapping them —
so author them as bricks.

What it buys, by construction:

- **Every part is complete art.** The #1 donation limit (occluded far legs,
  slim tails) disappears — there is no occlusion on a contact sheet.
- **The body core has no holes.** The closed-body architecture (parts
  overlay a complete torso) becomes native rather than retrofitted.
- **Per-part regeneration.** Redo one limb without redoing a master and
  re-cutting twelve layers.
- **Sockets become a generation contract.** Each part is requested with a
  standardized attachment stub (neck collar, shoulder patch, haunch band,
  tail root) — see §4 — instead of hoping two masters happen to agree.
- **Tooling gets simpler.** The segmentation/overlap-growth pipeline shrinks
  to sheet slicing plus rim growth at painted joints only.

Honest risks, with mitigations:

- **Cross-part coherence.** One painted master guarantees shared lighting,
  scale, perspective and anatomy; a sheet mostly does. Mitigate: generate
  the whole sheet as a single image (one style context), condition it on the
  approved full-body master as a reference input, and validate proportions
  against the master's measurements.
- **We lose pixel-exact reassembly QA.** Proposed reframe: **the master
  stops being the source of pixels and becomes the source of truth.** The
  approved full-body illustration remains the identity/QA artifact; the
  sheet becomes the extraction source; the acceptance check becomes
  "assembled neutral rig vs master: silhouette/proportion within tolerance"
  (measurable — contour overlap), replacing byte equality. Approval moves to
  the thing the product actually shows: the assembled rig.
- **Painted-in-place integration is gone** (the arm's shadow on the chest,
  shoulder folds). Price of mixability under any architecture; covered by
  contact-shadow slices per socket and/or a small runtime contact shadow.
- **Far-side treatment.** Masters paint far limbs darker in place; a sheet
  needs either a far-variant per limb or a runtime far-side dim. (Runtime
  dim composes well with §3.)

## 3. Neutral-value skin + runtime paint (owner proposal, sharpened)

Generate parts **value-only**: grayscale albedo keeping all baked form
shading, scale texture, AO, eyes/claws/teeth — hue and pattern stripped.
Runtime applies palette, shading tint and pattern as a **single global pass
over the assembled creature in stage space** (the rig's multiply-blend
pattern machinery already does the per-layer version of this).

- Kills failure class 3 outright: there are no two palettes to disagree.
- **Pattern continuity becomes a seam-stitcher**: bands/mottling that run
  continuously from the body onto a donated tail actively sell the parts as
  one animal — the strongest cheap seam-hider we have.
- Gives the genome's cosmetic axes a real job on the illustrated path, and
  moves pattern masks from "cut from the master" to per-part or procedural
  stage-space fields (the `pattern.ts` generator already exists).
- Composes with §2: ask for the contact sheet in neutral value.

## 4. Standardized junction sockets per archetype

The PoC's head swap works because both packs *happen* to share rear-cover
geometry — the cover anchor exploits luck. Formalize it: the framing
contract per archetype gains **canonical interface bands** (neck collar,
shoulder patch, haunch band, tail root — position, size and contour on the
shared stage). Parts pass through their sockets; any head fits any
same-archetype body because both sides agree on the interface, like a model
kit. Cross-archetype attachment (IR2 proper) is then *definable*: each
archetype publishes the same named sockets at its own positions, and an
attachment is a socket-to-socket mapping plus the §6 scale rule.

## 5. Retrofit and polish options (kept, re-scoped)

- **Closed-body retrofit for the two existing packs**: inpaint the openings
  shut (the overlap-growth tooling already does exactly this operation),
  flip donor parts above the body plate. Now primarily an **experiment** to
  validate the overlay architecture cheaply on existing art — and the
  fallback if sheet coherence disappoints.
- **Mesh-warped junctions** (the deferred skinned-hip work, generalized):
  warp a donor edge band onto the socket contour with falloff — the raster
  analog of v2's control-point morphing. Reserved as polish where realism
  pays most (hip/shoulder); not load-bearing for the architecture.
- **Rejected: runtime generative seam healing.** AI inpainting in the live
  loop breaks determinism and VISION ("AI is the reward, not the loop").

## 6. Scale policy (owner direction, 2026-07-22)

Two levels, decided in the owner's words and formalized here:

1. **Parts are species-literal — never scaled to fit.** T. rex arms on a
   sauropod look ridiculous *and they should*; the comedy is a feature
   (Tinkerer persona, "epoch: impossible" humor).
2. **Specimens are partially normalized.** A sauropod shouldn't be life-size
   against a velociraptor donor, but 1:1 stage-normalization (today's
   framing: every species fills ~95 % of the canvas) erases size identity
   entirely. Proposed deterministic formula: donor parts carry scale
   `(donorLengthMeters / baseLengthMeters)^k`, clamped, with
   `lengthMeters` from the species database (single source of paleontology
   truth — no invented sizes) and `k` the compression exponent:
   `k = 0` → pure Lego normalization, `k = 1` → life-size literal,
   expected sweet spot `k ≈ 0.3–0.5`, tuned live on a `/rig-lab` slider.
   Uniform scale about the part's anchor; composes with the existing
   translation-anchor model (`scaleAbout` already exists in the affine kit).

## 7. Experiment sequence (cheap first, each gates the next)

1. **Seal-the-openings**: inpaint one existing pack's body closed, flip
   donor z-order, re-shoot the hybrid matrix. Validates overlay
   architecture with zero new art. (~1 session)
2. **Desaturate-and-tint**: value-ify existing masters at load; one global
   hue/pattern pass over assembled hybrids. Measures how much unified paint
   hides, before committing to neutral generation. (~1 session)
3. **Parts-first probe**: generate ONE new species (Velociraptor is queued
   anyway) as a neutral-value contact sheet against the approved-master
   reference; slice, socket, assemble; compare against the trex/allo
   quality bar and run the scan + matrix. This is the D-021 evidence.
4. Only then: decide whether trex/allo get re-authored to the new spec or
   adapted via the retrofit.

**Scheduling note:** IR1 species expansion is paused until D-021 resolves —
mixing is the product's core loop (VISION), and every pack generated under
the current cut multiplies rework.

## 8. Decisions opened

| Row | Question |
|---|---|
| D-021 | Junction architecture: parts-first contact-sheet generation vs master-cutting + closed-body retrofit |
| D-022 | Scale policy: species-literal parts + partially-normalized specimens (formula + `k` + clamps) |
| D-023 | Neutral-value parts + runtime global paint/pattern as the pack spec going forward |
