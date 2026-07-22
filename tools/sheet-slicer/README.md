# sheet-slicer — parts-first pack pipeline

Assembles a **parts-first** illustrated-rig pack from an approved parts contact
sheet (the D-021 architecture: nine separately drawn pieces overlaid on a single
closed core, instead of the twelve-layer master cut in `tools/rig-pack`).

Chromium (via Playwright) is the raster engine, so there are no native image
dependencies. The approved master stays the identity/QA truth — it is **not**
the pixel source (D-021 reframe): the acceptance check is silhouette/identity
tolerance against the true master, not byte reassembly.

## Pipeline

1. **Sheet** — an accepted chroma-key-green parts sheet under
   `docs/rebuild/asset-generation/` (Template G v2: nine pieces + anchor + scale
   bar, closed core, full-thigh legs, open mouth, socket stubs). Round-4:
   `probe-trex-parts-sheet-r4-neck-fixed.png`.
2. **Measure** — `node tools/sheet-slicer/measure.mjs <sheet.png> [out.json]`
   chroma-keys the green, labels connected components, and prints each piece's
   bbox / centroid / stub extent. Read-only; it seeds the slice manifest.
3. **Slice manifest** — author `<pack>.slice.json`: per piece an
   `expectCentroid` (matched to a component), a keep|crop table as per-edge crop
   fractions, `scale`, `rotate`, and an `anchor`→`dest` placement in the
   1536×1024 stage. The keep/crop table is external metadata (not derivable from
   pixels — every stub cap looks identical). Placement normalizes each piece
   piece → anchor → true master.
4. **Slice** — `node tools/sheet-slicer/slice.mjs <sheet.png> <slice.json>
   <outDir>` writes the pack: full-canvas transparent `layers/`, procedural
   stage-aligned `pattern-masks/` (reusing `tools/rig-pack/page-lib` fields),
   a desaturated `value/` variant (D-023 runtime-paint storage), the true master
   underlay, a red hole-detector `debug/hidden-overlap-map.png`, and
   `debug/reassembled-transparent.png` + `debug/identity-over-master.jpg` for the
   verify loop. `manifest.json` / `layer-index.csv` follow the pack contract.
5. **Def + integrity** — mirror the manifest bounds into the `PartsRigDef`
   (`packages/illustrated-rig/src/parts-defs.ts`); the web integrity test
   (`apps/web/tests/rig-assets.test.ts`) enforces def ⇄ manifest agreement.

## Design notes

- **Chroma-key, not luminance key** — the pale tuck stubs (lum ~254) survive a
  green key; a luminance key would eat them at the load-bearing joints.
- **Green despill** — thin bright features (tooth tips) pick up a green rim from
  the antialiased key edge; the slicer clamps green ≤ max(r, b), a no-op on brown
  hide and a fringe-killer on teeth.
- **Crop fractions carry the keep/crop table** — CROP an edge whose pale cap
  would show over its neighbour (head rear over neck, neck base over core, core
  rear over tail, limb hips over the core); KEEP an edge that tucks under a
  neighbour that backs it (jaw rear under the head, tail root under the core).
  Parts draw OVER the closed core, so the core backs every limb joint — most
  stubs can be cropped without opening a gap.
