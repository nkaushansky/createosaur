# trex-pf-r0 — parts-first T. rex pack (D-021 architecture probe)

The first **parts-first** illustrated-rig pack: nine separately drawn pieces —
`neck`, `core` (torso-through-pelvis, one closed shape), `head-upper`,
`jaw-lower`, `near-arm`, `far-arm`, `near-leg`, `far-leg`, `tail` — assembled
over the closed core, versus the twelve-layer master cut in `trex-r0-v2`.

- **Source**: `docs/rebuild/asset-generation/probe-trex-parts-sheet-r5b-head-cover.png`
  (round-5 head-cover sheet — a focused fixer round that gave the upper head a
  generous rear-edge cover and fixed the flat round-4 neck), sliced by
  `tools/sheet-slicer`.
- **Identity truth**: the approved master (`../trex-r0-v2/debug/approved-master-original.png`),
  shipped here as `trex-pf-master.png` for the debug underlay. Per D-021 the
  master is the identity/QA reference, not the pixel source — acceptance is
  silhouette/proportion tolerance, not byte reassembly.
- **z-contract**: parts draw OVER the closed core (limbs/tail/neck/head above
  the core), the inverse of the master cut's legs-under-a-hole-cut-torso. The
  core has no openings, so no limb hole can gap.
- **Extras**: `value/` holds a desaturated variant of every layer (form shading,
  scales, eyes/teeth/claws kept; hue stripped) for the D-023 runtime-paint work.
  The first rig ships painted; the value pass is stored, not yet wired.
- **Pattern**: `pattern-masks/` are procedural stage-aligned fields (solid /
  mottle / bands), not cut from the master. Bands run continuously body → tail,
  the seam-stitcher §3 predicted.

Not owner-approved-original art, so this pack is not byte-hash-locked like
`trex-r0-v2`; the web integrity test validates its manifest, def ⇄ manifest
bounds agreement, and runtime-file presence. Regenerate with
`node tools/sheet-slicer/slice.mjs <sheet> tools/sheet-slicer/trex-pf-r0.slice.json apps/web/public/rigs/trex-pf-r0`.

Viewable at `/rig-lab?species=trex-pf`, beside `trex-r0-v2` in the Rig dropdown.
