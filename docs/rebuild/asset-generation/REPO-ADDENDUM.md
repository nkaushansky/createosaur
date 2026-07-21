# Asset Generation — Repo Addendum (IR0 technical contract)

The seven sibling documents are the owner-approved, ChatGPT-authored asset
generation bible, checked in verbatim on 2026-07-20. They carry the art
direction and staged workflow. This addendum is the **repo-side technical
contract** — everything IR0 measured that the bible does not yet specify.
Where they differ, this file wins; each delta is listed so the next bible
revision can absorb it.

## 1. Canvas and framing (bible: unspecified)

- Canvas: **1536 × 1024 px**, matching `trex-r0-v1`. All layers, masks and
  debug artifacts share this full-canvas alignment with origin (0, 0).
- The creature **always faces LEFT**. The rig stage, pose math, and future
  family/hybrid composition assume one facing; Template B's "[LEFT or
  RIGHT]" placeholder is amended to LEFT, always.
- Ground contact ≈ **y 780–800**, body spanning ≈ **95 % of canvas width**
  (the measured T. rex/Allosaurus family framing; an earlier revision of
  this file said 70–85 %, which was wrong) — match the approved masters'
  visual weight so species read at a shared scale on the shared stage.
- Approved master background: flat warm paper, **RGB(250, 247, 242)** (the
  pack's recorded `backgroundSample`). Clean master and layers: transparent.
- **Mouth: PARTIALLY OPEN, never sealed** (supersedes Template B's "mouth
  closed or nearly closed"; owner decision 2026-07-21). The master must show
  both tooth rows and a dark mouth-interior gap between them — roughly
  10–15 % of head height at the widest point, a calm parted mouth, not a
  roar. Rationale: the rig can *close* an open mouth (the jaw rotates up and
  painted pixels tuck into hidden overlap under the cheek) but can never
  *open* a sealed one — a closed-mouth master contains no interior pixels,
  so the jaw axis dies at a few degrees (measured on `trex-r0-v1` /
  `allosaurus-r0-v1`: background shows through the slit past ~8–10°). Cut
  contract for the mouth: lower tooth row + interior floor belong to
  `jaw-lower`; upper tooth row + interior roof/shadow belong to
  `head-upper`; `head-upper`'s cheek overlap conceals the jaw's rear edge
  through the full swing. Neutral pose = as-painted opening, and it is also the
  **widest** pose: the head tops the z-stack so nothing can back a reveal
  beyond the painted gap — the jaw range spans pressed-shut (negative) to
  the as-painted open (0). Paint the master's gap as wide as the species
  should ever gape.

## 2. Hidden-overlap depth (bible: "seems sufficient for modest motion")

IR0 measured what "sufficient" means; these are now requirements:

- Minimum **16 px** of concealed extension at every moving joint; **≥ 24 px**
  where the near thigh's front meets the belly contour.
- **Cut edges of overlap regions must follow painted anatomy creases —
  never straight polygon lines through open hide.** Straight cut edges were
  the root cause of IR0's stride-range cap: at larger swings the leg slides
  off the overlap and the razor-straight edge reads as a tear
  (`docs/rebuild/rig-lab/README.md`, "Stride finding").
- The tail-underside spur behind the near thigh either belongs to the
  **thigh layer** (so it moves with the leg) or its cut edge stays ≥ 16 px
  behind the calf silhouette at 6° of thigh swing.
- **The inter-leg region needs deep rims on the far-leg layers** (verified on
  `allosaurus-r0-v1`: 44 px). When the near leg swings forward and the far
  leg back, the band between them is vacated and only the far-leg layers sit
  low enough in the z-stack to fill it with hidden art.
- **Bottom-of-z-stack layers cannot be backed by overlap** — nothing draws
  behind the far leg, so any gap it opens against itself is bare background.
  Keep the far-knee counter-rotation small (≈ 4°) and place the knee pivot
  on the visible thigh/shank seam so divergence is least along the cut.

- **Limb polygons must contain the limb's full painted edge.** Any strip of
  a limb's painted silhouette left to a static layer (remainder healing or a
  polygon cutting inside the art) detaches as a floating chip the moment the
  limb swings. Measure the painted edge from the master per row; don't
  eyeball it. Ownership seams between thigh and shank sit ON the painted
  knee crease (where the counter-rotation pivots), never below it.
- **The jaw's concealed extension must not copy the tooth rows**
  (`overlapExclude` in the segmentation; `tools/rig-pack` supports per-layer
  no-grow polygons). Structured features ghost when revealed; plain hide and
  mouth interior do not.

These rules are verified on `trex-r0-v2` and `allosaurus-r0-v2`: both hold
the **full ±1 stride** (the enclosed-hole scan is flat-or-decreasing across
the whole pose matrix) plus a full jaw clench, from the same masters, cut
entirely in-repo.

## 3. Machine-readable pack contract (bible: "manifest / index exists")

The image model produces pictures; the numbers come from extraction tooling.
Every pack ships, in the exact `trex-r0-v1` shape:

- `manifest.json` — rigId, canvas, backgroundSample, drawOrder,
  per-layer `{ id, z, source, fullCanvasOrigin, bounds, visibleBounds,
  visiblePixelCount, overlapPixelCount, patternMasks }`, patterns block,
  and a verification block (max/mean visible RGB error, max alpha error
  against the approved master — target 0).
- `layer-index.csv` — the same table for humans.
- A SHA-256 checksum list covering every file in the pack.

Claude Code owns generating and verifying these at integration time
(`validateRigManifest` / the integrity-test pattern generalize per species).
Slices are delivered as full-canvas-aligned transparent PNGs; masks as
full-canvas opaque grayscale (white = patterned hide, luminance = coverage).

## 4. Layer ids (bible: `far-forelimb` / `near-forelimb`)

The shipped pack and validation code use **`far-forearm` / `near-forearm`**.
Theropod packs reuse the twelve `trex-r0-v1` ids verbatim; the bible's
"forelimb" naming is amended to match. Other archetypes extend the id set
only where the anatomy demands it (bible §5 of the layer contract).

## 5. Package naming

`<species>-r0-v1` (e.g. `allosaurus-r0-v1`), matching `trex-r0-v1`: the
`r` number is the per-species rig revision, independent of the IR milestone.
Never overwrite an approved pack — bump `v`.

## 6. Scope nuance (bible collaboration guide §1)

"No longer 'realism later in an AI portrait layer'" applies to the **live
render** only: D-020 supersedes D-019's procedural-only constraint, but the
M5 AI-portrait finishing layer remains in the roadmap as the optional
finish. The bible's statement is about the live loop, not about M5.

## 7. Division of labor per species (summary — revised 2026-07-21)

The bible's Stages 2–4 originally assigned extraction to the ChatGPT image
workflow. Practice showed the exact-source properties (zero-error
reassembly, pixel-copied overlap) come from **programmatic cutting**, not
image generation — so extraction moved in-repo:

1. ChatGPT: the **approved master illustration only** (Stage 1, per the
   bible's staged workflow and Template A/B with this addendum's framing).
2. Claude Code: everything after the master — segmentation authoring and
   the full cut via `tools/rig-pack/` (layers, crease-following overlap,
   pattern masks, manifest/csv, debug artifacts, zero-error verification),
   integrity tables, repo integration, rig tuning, tests, screenshots
   (`AGENT-GUIDE.md` verify loop). First pack produced this way:
   `allosaurus-r0-v1`.
3. Owner: approves the master before cutting, reviews the pack's contact
   sheets, and approves the interactive result before any species is marked
   shipped.
