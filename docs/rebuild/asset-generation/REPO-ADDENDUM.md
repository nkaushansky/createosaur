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
- Ground contact ≈ **y 780**, body spanning roughly 70–85 % of canvas width
  — match the approved T. rex's visual weight so species read at a shared
  scale on the shared stage.
- Approved master background: flat warm paper, **RGB(250, 247, 242)** (the
  pack's recorded `backgroundSample`). Clean master and layers: transparent.

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

Packs meeting these rules restore the full ±1 stride range that
`trex-r0-v1` had to cap at ±0.6.

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

## 7. Division of labor per species (summary)

1. ChatGPT: approved master → slices with painted hidden overlap → per-layer
   masks (staged, per the bible's workflow docs).
2. Claude Code: extraction verification, manifest/csv/checksum generation,
   reassembly-error measurement, repo integration, rig tuning, tests,
   screenshots (`AGENT-GUIDE.md` verify loop).
3. Owner: approves the master before slicing, and the interactive result
   before any species is marked shipped.
