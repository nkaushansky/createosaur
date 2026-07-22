# IR0 visual review matrix — Illustrated Rig R0 (`/rig-lab`)

> IR1's hybrid mixing PoC has its own matrix, measurements and findings in
> [`hybrid/`](hybrid/README.md). The first parts-first assembly (D-021
> architecture probe — `trex-pf-r0`, nine pieces over a closed core) has its
> own matrix and measurements in [`parts-first/`](parts-first/README.md).

Captured 2026-07-19 from the static export (`npm run build` → `serve out`),
Chromium, stage extracted at native resolution and scaled to 0.75 on the
paper backdrop. Every state below is reproducible in the app: presets set the
motion axes; `?t=<ms>` freezes the deterministic clock for pixel-stable
screenshots.

## States

| File | State | What to check |
|---|---|---|
| `01-neutral.png` | Neutral, no pattern | Reassembly matches the approved master |
| `02-inhale.png` | Breath 1.0 | Torso mesh lift, neck compensation, planted feet, chest/arm unison |
| `03-look-up.png` | Head +6°, jaw 0.4° | Head↔neck seam under the bend, jaw hinge |
| `04-stride.png` | Stride +0.55 (preset) | Thigh roots, knees, trailing-edge behavior |
| `05-reverse-stride.png` | Stride −0.6 (slider bound) | The mirrored contacts (near-thigh front, arm/belly) |
| `06-stress.png` | Every axis at its bound | The deliberate seam test |
| `07-pattern-solid.png` | Solid @ 0.75, inhale pose | Luminosity preserved, fixed details not flattened |
| `08-pattern-mottle.png` | Mottle @ 0.75, inhale pose | Blotches move with anatomy, cross-seam registration |
| `09-pattern-bands.png` | Bands @ 0.75, inhale pose | Band continuity across torso/pelvis/tail while deformed |
| `10-debug-hidden-overlap-stress.png` | Overlap map under stress pose | Red = concealed overlap; it glows through any opened seam |
| `11-debug-mesh-pivots.png` | Mesh/pivot overlay, inhale | Grid extents (incl. hidden regions), pivot placement |
| `12-debug-master-underlay.png` | Approved-master ghost, neutral | Rig-vs-master alignment |
| `13-page-light.png` / `14-page-dark.png` | Full page, both themes | Controls, layout; specimen paper stays paper |
| `15a-current-renderer-trex.png` / `15b-ir0-rig-trex.png` | Production `/lab` procedural T-Rex vs IR0 | The before/after this experiment exists to compare |
| `16-page-mobile.png` / `16b-page-mobile-scrolled.png` | Pixel-7-class viewport, top and fully scrolled | Stage stays pinned while controls scroll (owner phone feedback, 2026-07-20) |

## Measured performance (`measurements.json`)

- Runtime asset payload (manifest + 12 layers + 36 masks + debug art):
  **11.27 MB** fetched; first complete rig on desktop Chromium in **755 ms**
  from a local static server (network time will dominate on real hosting —
  the pack is the 1536×1024 R0 extraction, not an optimized production
  atlas).
- Desktop frame cost (evaluate pose + Pixi render, 1536×1024 backbuffer):
  **~11 ms** average during auto-idle — inside a 60 fps budget.
- The "mobile" row was captured under Playwright's Pixel-7 emulation on
  CI-class software GL (SwiftShader): **~297 ms/frame, 11.2 s first rig**.
  That is a floor, not a phone: there is no hardware GPU in the container.
- **Real-device result (owner, 2026-07-20, via the DreamHost staging copy):
  "loads almost immediately, feels very responsive and lightweight."** The
  open mobile-performance question is answered; the emulated numbers above
  were indeed only the software-GL floor. The bounds-cropped-texture /
  WebP-atlas optimizations remain future options, not current needs.

## Seam-review outcome (three iteration rounds)

Round 1 found four real defects, all fixed by pose-model changes (no art was
touched): a chest/arm hairline under breath (fixed by flattening the
breathing field across the arm-contact strip and driving both arms with the
identical displacement), a far-thigh/belly gap at stride (far-hip pivot moved
to the front-edge contact, swing reduced), a shank corner popping past the
thigh silhouette (leading-shank counter-rotation removed), and an arm/belly
tear at reverse stride (arm stride-swing removed; arms live on breath drift
alone). A quantitative gap detector (transparent pixels flanked by solid art)
reads neutral 41 / inhale 40 / stride 43 / stress 50 px — i.e. the posed
states sit at the rest pose's own crevice baseline.

## Stride finding (owner phone review, 2026-07-20) and the pack limit

Owner-reported leg gaps at the stride extremes were root-caused by per-layer
attribution (a `setLayerVisible` debug hook exists for exactly this): the
pack's hidden-overlap regions are cut with **straight polygon edges** (see
the overlap map), and at large leg swings two of those cut lines leave their
cover — the tail-root extension behind the near calf, and the near-thigh
front against the belly contour. These are source-art limits, not rig bugs;
no transform can heal an exposed cut edge. Mitigations shipped: leg
amplitudes trimmed ~20%, the stride control is capped at ±0.6 (the pack's
seam-clean envelope — documented in `MOTION_RANGES`), and the tail-root
flesh now follows the forward leg slightly (weight-faded haunch follow),
which closes the remaining slit to a crease. At −0.6 a ~3 px hairline
remains at the thigh-front cut line at close zoom.

**Requirements for the next pack revision** (both are slice-construction
rules, cheap in the ChatGPT extraction workflow):

1. Extend the near-thigh's hidden overlap forward along the belly contour by
   ≥24 px, with the cut edge following the belly's painted crease (never a
   straight line through open hide).
2. Assign the tail-underside spur behind the near thigh to the thigh layer
   (it moves with the leg), or extend the tail-root overlap so its cut edge
   stays ≥16 px behind the calf silhouette at 6° of thigh swing.
