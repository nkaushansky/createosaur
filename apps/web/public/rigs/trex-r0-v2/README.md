# Createosaur R0 T. rex Layer Pack v2

Cut in-repo by `tools/rig-pack` from the owner-approved open-mouth master
(2026-07-21; original preserved at `debug/approved-master-original.png`).
Supersedes `trex-r0-v1`: the master now paints a partially open mouth
(both tooth rows + dark interior), so the jaw axis can really close — the
mouth boundary keeps the upper row on `head-upper` and the lower row +
interior floor on `jaw-lower`, with the jaw drawn UNDER the head for correct
occlusion at full clench and a concealed cheek tuck.

- Every visible pixel is copied verbatim from the approved master
  (zero-error reassembly verified at cut time; see `manifest.json`).
- Hidden overlap follows painted creases with deep leg rims
  (far leg 44 px, near shank 28, near thigh 32) per the IR1 slice rules.
- The jaw's concealed extension has a no-grow zone over the tooth rows
  (`overlapExclude`) so motion never reveals ghost teeth.
- Pattern masks are seeded stage-aligned fields clipped per layer
  (seed 20260718 — the same T. rex individual as v1).
