# Createosaur Allosaurus Layer Pack v1

Controlled extraction from the owner-approved Allosaurus master illustration
(generated 2026-07-21 in the ChatGPT master workflow, approved after the
framing/riggability checks in `docs/rebuild/asset-generation/`).

## What is exact

- Every visible pixel comes from the approved full-body composite.
- The transparent master and individual visible layer regions share the same
  source pixels; the reassembled creature verifies at **zero** visible RGB
  error and **zero** alpha error against the clean master.
- All layers use a full-canvas origin of `(0, 0)` at 1536×1024.
- Pattern masks are clipped to the exact exported layers, including the
  concealed overlap.

## How this pack differs from trex-r0-v1

This pack was cut **in-repo** by `tools/rig-pack` (segmentation authored in
`tools/rig-pack/allosaurus-r0-v1.segmentation.json`, reviewed visually over
ownership overlays), applying the IR0 slice rules recorded in
`docs/rebuild/asset-generation/REPO-ADDENDUM.md`:

- hidden-overlap cut edges follow painted anatomy creases, never straight
  polygon lines through open hide;
- ≥16 px concealed extension at every moving joint, ≥24 px at the
  near-thigh/belly contact;
- no narrow static strips owned beside large-motion layers (the tail-root
  area behind the near thigh is partitioned to avoid IR0's stride-cap
  artifact class).

## Hidden overlap method

Lower layers are extended only inside the approved silhouette; concealed
overlap borrows exact neighboring source pixels covered by the layers above
in the reference pose. Overlap stays ≥2 px inside the antialiased exterior
silhouette so reassembled alpha is untouched.

## Pattern masks

Per layer: `solid.png`, `mottle.png`, `bands.png` — grayscale, stage-aligned
shared fields (seed `20260720`) exported per layer so each mask moves with
its anatomical layer. Fixed details (eye, tooth row, hand and foot claws)
are excluded from the fields.

## Limitation

Source-resolution R0 prototype pack at 1536×1024. It proves the repeatable
extraction pipeline for IR1; it is not a hand-authored production master.
No trait pack is included.
