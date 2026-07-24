# trex-sock-r0 — socket-era T. rex pack (D-024)

The first pack authored to the **socket-era contract** (`docs/rebuild/
IR-LESSONS.md`): nine grayscale value pieces — `neck`, `core`
(torso-through-pelvis, one closed shape), `head-upper`, `jaw-lower`,
`near-arm`, `far-arm`, `near-leg`, `far-leg`, `tail` — generated onto socket
templates and assembled over the closed core.

- **Source**: Template S sheets (`docs/rebuild/asset-generation/`):
  the head trio from `trex-sheet-a.png`, body/limbs/tail from
  `trex-sheet-b.png`, spliced via the slicer's per-piece `sheet` routing.
  Both were generated against `trex-value-master.png` (S-M), which is
  frame-registered to the approved painted master.
- **Grayscale by design**: the layers ARE the D-023 value art (no `value/`
  dir). Hue lives nowhere in this pack; color/pattern arrive at runtime.
- **Identity truth**: `trex-sock-master.png` (the S-M value master), used as
  the debug underlay. Acceptance is silhouette/identity tolerance: IoU
  0.735, 87.6 % master coverage, bbox aspect Δ 2.5 %.
- **z-contract**: parts draw OVER the closed core; the core has no openings,
  so no limb hole can gap (scan flat-or-falling across the pose sweep).

Not owner-approved-original art, so not byte-hash-locked; the web integrity
test validates manifest shape, def ⇄ manifest bounds agreement, runtime-file
presence, and the no-`value/` grayscale contract. Regenerate with
`node tools/sheet-slicer/slice.mjs docs/rebuild/asset-generation/trex-sheet-b.png tools/sheet-slicer/trex-sock-r0.slice.json apps/web/public/rigs/trex-sock-r0`.

Viewable at `/rig-lab?species=trex-sock`, beside the master-cut rigs in the
Rig dropdown.
