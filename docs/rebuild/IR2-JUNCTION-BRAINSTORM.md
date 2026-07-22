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

## 7. Experiment sequence (revised 2026-07-22 — owner call: go straight to
the probe)

1. **T. rex parts-first probe** (Template G): regenerate the calibration
   species as a parts contact sheet against its approved master — painted
   first (judged against the known bar, isolating the D-021 architecture
   variable), then a neutral-value + pattern-overlay variant of the same
   sheet in the same thread (the D-023 evidence). Slice, socket, assemble;
   run the scan + matrix; re-test mixing against the existing Allosaurus
   pack. T. rex over Velociraptor because it is the only species with an
   approved master anchor, the only clean A/B against existing baselines,
   and the reference animal every future thread anchors to.
2. **Velociraptor as pack two** — the first cross-proportion test of the
   socket contract (master approval can run in parallel with 1's rigging).
3. Then: D-021/D-023 decisions; Allosaurus re-authored or retired to
   the archive.

Retired: the seal-openings retrofit (parts-first makes the closed body
native; nothing left to validate on old art) and the standalone
desaturate-and-tint pass (folded into 1's neutral-value variant).

### Probe log — round 1 (2026-07-22, painted sheet)

`asset-generation/probe-trex-parts-sheet-r1.png`. The Template G asks all
landed: exactly ten labeled pieces plus the anchor, no invented rows; the
torso/neck/pelvis are complete CLOSED shapes (no limb holes — plain hide
across the shoulder and hip regions); both hind legs carry their full
thighs from inside the hip socket; two separately labeled arms; jaw
separated with the mouth interior on the head piece; every severed piece
ends in a plain pale stub with a dotted socket line; faint registration
grid present.

Findings for the slicer and for sheet spec v2:

1. **Stubs are directional and the sheet's are uniform.** A stub is only
   hidden if its piece draws UNDER the neighbor. KEEP the stub (articulation
   margin) where the piece tucks under: limb shoulder/hip stubs, tail root,
   pelvis front, torso front — and the **jaw rear**, which tucks under the
   head cheek (ADDENDUM §1 mouth contract). CROP at the dotted socket line
   where the piece's pale cap would show over its neighbor: head rear, neck
   rear, torso rear. This keep/crop table is NOT derivable from pixels
   (every cap looks identical) — it ships as external per-piece metadata.
   (Round-1 wording erroneously listed jaw-rear as CROP; corrected here to
   reconcile BRAINSTORM §7 with ADDENDUM §1.)
2. **Scale drift is the open QA item** — piece-vs-anchor proportions must
   be measured at slicing (per-piece normalize if small, piece-fixer
   regeneration if large). Eyeball says close but not exact.
3. **Far-side pieces came back at near-side value** (no baked shadow
   dimming). Arguably better than asked: identical near/far art plus a
   runtime far-side dim halves future part authoring — candidate spec
   change for Template G v2.
4. **The anchor row is a re-render of the approved master, not a copy** —
   expected; identity QA is the tolerance comparison against the true
   approved master per §2's reframe.

### Probe log — round 2 (2026-07-22, neutral-value sheet + evaluation panel)

`asset-generation/probe-trex-parts-sheet-r2-neutral.png` — the same-thread
neutral variant. A five-lens adversarial evaluation panel (registration,
identity, slicing, cross-species, product) read both sheets + the true
master and reached **adopt-parts-first as the ARCHITECTURE (high
confidence), but keep D-021 and D-023 OPEN** — commit to the direction,
close the decisions only on assembled + mixed evidence.

**Proven where it had to be (the architecture bet):**
- Body core is genuinely CLOSED on both sheets — torso/neck/pelvis are
  continuous hide with stub caps, zero limb holes (slicing lens measured
  zero enclosed holes > 120 px). This is D-021's load-bearing claim.
- Both hind legs carry their full thigh; tail is complete root-to-tip. The
  occluded-far-leg / slim-tail donation limits are gone by construction.
- Cross-part coherence — parts-first's #1 honest risk (§2) — did NOT
  materialize on the painted sheet: one light, one palette, matched texture
  density; left/right pairs measure scale-matched (hind legs 203/204 px,
  arms 96/96 px).
- Neutral-value authoring is real, not a flat desaturate: r2 chroma ~2 vs
  ~41 painted, blotches moved off the value into the row-6 overlay, form
  shading / AO / scales / eyes / teeth / claws retained.

**Why the decisions stay open (what the pixels also showed):**
- **Nothing mixing-critical is demonstrated.** No assembled rig, no
  value×pattern composite, no hybrid. All three failure classes (§1) are
  addressed *by construction on separated ingredients* — plausible, not
  proven. §3's "pattern continuity as seam-stitcher" is entirely untested.
- **Neither sheet is cleanly sliceable end-to-end, and they break
  differently.** r1 (painted) silently re-rendered the mouth nearly CLOSED
  and baked a closed mandible into the UPPER-HEAD piece → head/jaw cannot
  be sliced to the ADDENDUM §1 open-mouth contract. r2 (neutral) got the
  mouth right but drifted badly geometrically: its own head ~1.6× and tail
  ~1.53× its anchor, and the **tail is redrawn straight and stringy**
  (~0.76 of body length vs the master's ~0.51 thick curved taper) —
  unsalvageable by any single scale factor. The best-case calibration
  animal, drawn with a master in hand, still flipped the most swap-critical
  pose on one pass and mangled the tail on the other.
- **The two sheets are NOT registered** — independent re-illustrations
  (cross-sheet piece-width ratios 0.59–1.44). Any pipeline that slices
  neutral for geometry and borrows painted for pattern is dead on arrival.
- **Batch identity drift from the TRUE master:** teeth softened from banana
  teeth to small croc pegs, reduced skull tubercles, warmer/less-dense
  texture — uniform (the on-sheet anchor drifted identically, and the two
  anchors disagree ~14 % in height) but real and off-model. §2's proposed
  silhouette/contour QA is BLIND to it. Normalize and QA against the true
  approved master, never the on-sheet re-render.
- **D-023 is HALF-proven.** Value half: yes. Paint half: no. The row-6
  pattern overlay is a whole-body master-pose raster WITH its own baked
  form shading — multiplied over value pieces it double-shades and
  misregisters on any posed/exploded/hybrid part. It proves the pattern
  *design* and separability, not a runtime asset. Runtime pattern must
  become a `pattern.ts` stage-space field or per-part flat-pigment masks.
- **D-021 geometry alone does not kill failure class 3** (paint
  discontinuity): a full-thigh painted leg still overlaps a painted pelvis,
  so two baked palettes meet at the haunch. Only the D-023 neutral +
  global-paint path removes it — **D-021 and D-023 are coupled** for a
  complete fix.
- **Cross-species is unmeasured**, and the frozen "exactly 10 pieces, no
  invented rows" rule will actively BLOCK what quadrupeds (4 distinct
  legs), sauropods (segment-chain neck/tail) and ceratopsians
  (frill/horns/beak) need. Feathers break the value+pattern-over-hide and
  gape-and-teeth mouth semantics outright. T. rex validated the
  architecture, NOT Template G as a cross-species generator.

**In-repo desaturate test (settles the derive-vs-regenerate fork, cheaply,
this session).** The panel split on whether to source the neutral pass by
desaturating the painted pieces (geometry-identical, free) or by fresh
value-only generation (the painted blotches might carry enough luminance to
survive desaturation and violate D-023). Direct test on the r1 painted
torso hide (`asset-generation/probe-r1-torso-desaturate-test.png` (painted top, luminance-desaturated bottom)): Rec.601 luminance
desaturation removes MOST of the discrete blotch pattern — the blotches are
predominantly **hue-encoded** (painted chroma ~40; after desaturation the
blotch-scale luminance contrast drops to ~9, mostly reading as form-shading
and scale relief, not discrete pattern). **Leans DERIVE:** desaturate the
painted pieces for geometry-identical value, then suppress the residual
low-frequency tonal mottle so a runtime pattern multiply is the sole
pigment source. (Directional finding — one piece, one luma weighting;
confirm across all pieces at slice time.)

**Sheet-spec v2 change-list** (from the panel; the biggest few need owner
buy-in before Template G is rewritten):
- FREEZE what worked: closed core, thigh-belongs-to-leg, complete tail,
  directional stubs + dotted sockets, labeled pieces + same-scale anchor,
  no invented rows *for theropods*.
- **Chroma-key background** (saturated green/magenta), not warm paper —
  the pale tuck stubs (lum 254–255) get eaten by a luminance background key
  at exactly the load-bearing joints; hue-keying fixes it. Highest-leverage
  single change.
- **Two-color reserved stub tints** (one for KEEP, one for CROP) so the
  directional table is machine-readable off the sheet.
- **Machine-readable per-piece manifest** shipped with the sheet: piece id,
  each end keep|crop, expected scale vs true master, pose lock, sheet light
  vector. (Fixes jaw-rear = KEEP.)
- **Enforced registration**: readable numbered grid or corner fiducials +
  scale bar; per-piece expected dimensions in grid units, verified at
  slice (r2 free-scaled every piece even with a faint grid present).
- **Per-piece proportion + pose + curvature spec** from the species DB
  (tail length fraction, drawn in master curvature) — blocks the r2 tail.
- **Identity-fidelity gate** beyond silhouette (teeth shape/size, tubercle
  density, texture density) against a reference crop of the TRUE master.
- **Pattern deliverable → per-part flat-pigment masks or a `pattern.ts`
  field spec** (no baked shading); demote any whole-body overlay to
  "reference only". Add a hue/palette proof so the paint half is testable.
- **Per-archetype socket/piece registry + material-class parameter**
  (scaled hide / feathers / keratin / frill) before any non-theropod — the
  fixed 10-piece list is theropod-only.
- **Reconsider the 3-barrel core**: it adds two intra-body seams the master
  never had (neck–torso, torso–pelvis); trivially hidden on a bulky
  theropod, maybe not on slender/columnar archetypes.

**Slicer requirements** (priority order): normalize each piece to the TRUE
master with a hard proportion/silhouette gate that can REJECT+re-roll a
single piece (not just scale it); do NOT slice r1 head/jaw as-is
(regenerate to the open-mouth cut or borrow r2's head first); carry the
keep/crop table externally; matte off the dotted socket line, never a
background key on the pale stubs; handle r2's full-width section rules that
bridge pieces (key wide-thin strictly to avoid deleting the legitimately
wide-thin tail); treat painted and neutral passes as independent; runtime
pattern from `pattern.ts`, never the overlay raster; runtime far-side dim;
keep a feature mask for teeth/claws/eyes out of the global multiply.

**The mixing re-test is only valid parts-first-vs-parts-first** — testing
this T. rex against the existing master-cut Allosaurus would surface
Allo-side holes misread as parts-first failures. Re-author Allosaurus
parts-first before mixing.

Next (ordered): (1) fix the doc/spec bugs — done here for jaw-rear;
(2) settle the neutral-source fork — done, leans derive; (3) rewrite
Template G → v2 with the change-list, re-probe T. rex, THEN Velociraptor
after the per-archetype socket registry exists; (4) build the slicer and
rig the painted pieces to produce the FIRST assembled composite (the
artifact that actually tests failure-class elimination); (5) author the
`pattern.ts` stage-space field + a value×pattern composite + one hybrid to
close the paint half of D-023; (6) re-author Allosaurus parts-first, then
close D-021/D-023 on assembled, painted, mixed evidence.

**Scheduling note:** IR1 species expansion stays paused until D-021
resolves — mixing is the product's core loop (VISION), and every pack
generated under the current cut multiplies rework.

## 8. The reference sheet, critiqued (owner upload, 2026-07-22)

`asset-generation/reference-parts-sheet-trex-chatgpt.png` — a ChatGPT
"2D rig prototype" parts sheet the owner received earlier — is the visual
proof-of-concept for §2, and its flaws wrote most of Template G
(`asset-generation/PROMPT-TEMPLATES.md`). Worth recording both halves:

**What it gets right (keep):** the approved master on the sheet as the
style/scale anchor row; both legs drawn complete (the far-leg donation
problem gone by construction); jaw separated from head with the mouth
interior painted; a light-shadow plane study and a separate whole-animal
pattern overlay (the generator independently proposing the D-023
value/pattern separation); trait add-ons (Triceratops horns/frill) as
separate socketable pieces with a composite preview.

**What it gets wrong (fix in the prompt):**

1. **Severance in the wrong place** (owner's catch): the legs are cut
   below the thigh — the thigh mass is baked into the torso/pelvis pieces,
   so legs could only swap at the knee. Parts must sever at their sockets:
   **the thigh belongs to the leg**, and the body core stays a complete
   closed shape with plain hide where limbs attach.
2. **Per-piece zoom drift**: the head and legs are drawn larger than the
   master row. Slicing needs one uniform scale across the sheet (a
   registration grid makes it verifiable).
3. **Ragged tear edges instead of socket stubs**: pieces end in torn-flesh
   edges with no overlap margin. Every severed piece needs a plain
   tuck-under stub past the socket line — that margin is what lets joints
   articulate without opening gaps.
4. **Sockets are lines + stubs, never holes**: the fix for the current
   architecture is not better-shaped openings — it is a body with no
   openings at all, and parts that overlap it at agreed contours.

## 9. Decisions opened

| Row | Question |
|---|---|
| D-021 | Junction architecture: parts-first contact-sheet generation vs master-cutting + closed-body retrofit |
| D-022 | Scale policy: species-literal parts + partially-normalized specimens (formula + `k` + clamps) |
| D-023 | Neutral-value parts + runtime global paint/pattern as the pack spec going forward |
