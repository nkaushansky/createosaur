# IR0 visual review matrix — Illustrated Rig R0 (`/rig-lab`)

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
| `04-stride.png` | Stride +0.92 | Thigh roots, knees, trailing-edge behavior |
| `05-reverse-stride.png` | Stride −1.0 (slider) | The mirrored contacts (near-thigh front, arm/belly) |
| `06-stress.png` | Every axis at its bound | The deliberate seam test |
| `07-pattern-solid.png` | Solid @ 0.75, inhale pose | Luminosity preserved, fixed details not flattened |
| `08-pattern-mottle.png` | Mottle @ 0.75, inhale pose | Blotches move with anatomy, cross-seam registration |
| `09-pattern-bands.png` | Bands @ 0.75, inhale pose | Band continuity across torso/pelvis/tail while deformed |
| `10-debug-hidden-overlap-stress.png` | Overlap map under stress pose | Red = concealed overlap; it glows through any opened seam |
| `11-debug-mesh-pivots.png` | Mesh/pivot overlay, inhale | Grid extents (incl. hidden regions), pivot placement |
| `12-debug-master-underlay.png` | Approved-master ghost, neutral | Rig-vs-master alignment |
| `13-page-light.png` / `14-page-dark.png` | Full page, both themes | Controls, layout; specimen paper stays paper |
| `15a-current-renderer-trex.png` / `15b-ir0-rig-trex.png` | Production `/lab` procedural T-Rex vs IR0 | The before/after this experiment exists to compare |
| `16-page-mobile.png` | Pixel-7-class viewport | Layout, no clipping |

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
  Real-device numbers are an open item for owner review; the obvious first
  optimization if needed is cropping layer textures to their manifest bounds
  (~4× less texture upload) and a WebP/atlas export in a future pack.

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
states sit at the rest pose's own crevice baseline. What remains at the full
stride/stress bounds are small dark nicks at the near-thigh's trailing and
front contacts, reading as crevice shadow; nothing resembling the round-1
white tears survives inside the control ranges.
