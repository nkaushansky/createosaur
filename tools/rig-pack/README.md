# rig-pack — species pack extraction pipeline

Cuts an approved species master illustration into a complete illustrated-rig
layer pack (the `trex-r0-v1` shape): 12 exact-source layers with
crease-following hidden overlap, per-layer pattern masks, manifest/CSV,
debug artifacts, and a zero-error reassembly verification. Chromium (via
Playwright) is the raster engine, so there are no native image dependencies.

## Pipeline per species

1. **Master** — owner-approved illustration per
   `docs/rebuild/asset-generation/` (canvas 1536×1024, facing left, paper
   background). Drop it at `tools/rig-pack/work/<species>-master.png`.
2. **Coordinate reference** — `node tools/rig-pack/grid.mjs <master> <outDir>
   x,y,w,h[,scale] ...` renders labeled 32 px grids for reading stage
   coordinates off the art.
3. **Segmentation** — author `<pack>.segmentation.json`: per-layer ownership
   polygons following painted creases, priority order, overlap radii,
   remainder region + its legitimate bounds, fixed-detail exclusions
   (eye/claws/teeth), pattern seed. This file is the versioned artistic
   source of truth for the cut.
4. **Preview loop** — `node tools/rig-pack/preview.mjs <master> <seg.json>
   <outDir> [crops...]` renders the ownership partition tinted over the
   master. Look, adjust polygons, repeat (AGENT-GUIDE verify loop).
5. **Cut** — `node tools/rig-pack/cut.mjs <master> <seg.json> <outDir>
   <packName>` writes the pack and prints the verification block. Max
   visible RGB error and max alpha error must be **0**.
6. **Review + integrity** — inspect the debug contact sheets, copy the pack
   under `apps/web/public/rigs/`, add its SHA-256 table to
   `packages/illustrated-rig/src/integrity.ts` (the web integrity test
   hash-locks every pack).

## Guarantees enforced by construction

- Every visible pixel of the assembled creature comes from exactly one layer,
  copied verbatim from the master (ownership partition + verified composite).
- Hidden overlap copies neighboring source pixels, extends ≥ the configured
  radius past each covered boundary, and stays ≥2 px inside the antialiased
  exterior silhouette (reassembled alpha is exact).
- Remainder-region leakage self-heals: stray pixels outside the remainder's
  declared bounds are reassigned to their geodesically nearest region, so
  polygon gaps can never ship as floating fragments.
- Pattern masks are shared stage-aligned seeded fields clipped per layer —
  deterministic for a given seed, moving with their anatomy.

## IR0 slice rules applied here

From `docs/rebuild/asset-generation/REPO-ADDENDUM.md`: overlap cut edges
follow painted anatomy creases (never straight lines through open hide —
the root cause of IR0's stride cap), ≥24 px at the near-thigh/belly contact,
and no narrow static strips owned beside large-motion layers.
