# Createosaur R0 T. rex Layer Pack v1

This pack is a controlled extraction from `tyrannosaurus_rex_in_detailed_profile.png`.

## What is exact

- Every visible pixel comes from the approved full-body T. rex composite.
- The transparent master and individual visible layer regions share the same source pixels.
- The exported layers use a full-canvas origin of `(0, 0)`.
- Pattern masks are clipped to those exact exported layers.

## Hidden overlap method

Lower layers are extended only inside the approved dinosaur silhouette. The concealed overlap borrows exact neighboring source pixels that are covered by the next layer in the reference pose.

Examples:

- neck extends beneath the head and lower jaw;
- torso extends beneath the neck;
- pelvis extends beneath the torso;
- tail extends beneath the pelvis;
- thighs extend beneath the torso/pelvis;
- shank/foot layers extend beneath the thighs.

This deliberately avoids generative repainting or anatomy drift.

## Verification

- Maximum visible RGB error after reassembly: `0`
- Mean visible RGB error after reassembly: `0.000000`
- Maximum alpha error after reassembly: `0`

A zero RGB error means the reassembled visible creature uses the exact source pixels. The reassembled alpha is also pixel-exact; overlap is restricted away from the exterior antialiased silhouette.

## Pattern masks

Each layer contains:

- `solid.png`
- `mottle.png`
- `bands.png`

The pattern fields align at the reference pose but are exported separately, so they move with their own anatomical layers during deformation.

## Important limitation

This is a source-resolution R0 prototype pack at `1536x1024`. It proves the layer, overlap and mask pipeline. It is not a replacement for a future hand-authored 3200x2000 production master.

No Triceratops assets are included.
