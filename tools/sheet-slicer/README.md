# sheet-slicer — parts-sheet pack pipeline

Assembles an illustrated-rig pack of separately drawn pieces overlaid on a
single closed core (nine pieces, vs the twelve-layer master cut in
`tools/rig-pack`). Built for the D-021 parts-first probe (now CLOSED —
verdict in `docs/rebuild/IR-LESSONS.md`); it carries forward unchanged as
the **socket era's** cutter: Template S sheets are chroma-key green with the
same anchor + scale-bar furniture, so the pipeline below applies as-is
(socket-cut compliance checking is the one planned addition, plus keying the
magenta guides).

Chromium (via Playwright) is the raster engine, so there are no native image
dependencies. The approved master stays the identity/QA truth — it is **not**
the pixel source: the acceptance check is silhouette/identity tolerance
against the true master, not byte reassembly.

## Pipeline

1. **Sheet** — a chroma-key-green parts sheet under
   `docs/rebuild/asset-generation/` (now Template S: grayscale value parts
   drawn onto a socket template; historically Template G painted sheets).
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
5. **Def** — mirror the manifest bounds into the `PartsRigDef`
   (`packages/illustrated-rig/src/parts-defs.ts`); socket-era packs re-add a
   web integrity test enforcing def ⇄ manifest agreement (the probe pack's
   test retired with the pack).

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

## Multi-sheet sourcing (per-piece `sheet`)

Because placement is **piece → true master**, never piece → piece, pieces may
come from different authored sheets. The slice manifest may declare extra
sheets and route any piece to one:

```jsonc
{
  "sheets": { "head": "probe-trex-head-assembly.png" },   // resolved beside the CLI sheet
  "pieces": [
    { "id": "head-upper", "sheet": "head", ... },          // from the head sheet
    { "id": "core", ... }                                   // from the default (CLI) sheet
  ]
}
```

The CLI sheet is the default; a piece with no `sheet` uses it. The only
requirement is that **every sheet carries the anchor + scale bar** so each is
normalized to the same master scale (the reason a neck from one sheet and a
head from another assemble cleanly — both are pinned to the master, not to
each other). Template S's per-species S-A (head assembly) + S-B (body &
limbs) sheets are exactly this: the socket-era slice manifest routes the
head trio to sheet A and everything else to sheet B. (Proven on the archived
probe pack, whose deep neck was spliced in from a second sheet.)

### Non-uniform scale (`scale: {x, y}`)

A piece's `scale` may be a number (uniform) or `{x, y}`. Use the object form
when the sheet's proportions differ from the master — e.g. the T. rex tail is
drawn far too slender, so `{x: 0.82, y: 1.4}` gives it a T. rex root thickness
without lengthening it off-canvas. Prefer fixing gross proportion on the sheet;
non-uniform scale stretches the scale texture and is a rescue, not a default.
