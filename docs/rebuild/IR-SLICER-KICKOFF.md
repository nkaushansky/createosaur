# IR slicer kickoff — parts-first pack pipeline (post-probe build)

Read first: `IR2-JUNCTION-BRAINSTORM.md` (§7 probe logs — round 4 is the
GO), `asset-generation/PROMPT-TEMPLATES.md` Template G v2, and
`rig-lab/hybrid/README.md`. Decisions: D-021 architecture adopted /
decision open; D-022 scale policy proposed; D-023 value half proven.

## Objective

Build the sheet slicer and rig the accepted round-4 sheet, producing the
**first assembled parts-first T. rex** in `/rig-lab` — the artifact that
actually tests failure-class elimination (brainstorm §1).

## Inputs (all in-repo)

- Sheet: `asset-generation/probe-trex-parts-sheet-r4-neck-fixed.png`
  (nine pieces + anchor + 1 m scale bar, chroma-key green, accepted).
- Measurements: `asset-generation/probe-r4-scale-measurements.json`
  (per-piece scale ~1.4× vs on-sheet anchor; tail ~1.5–1.8×; neck −50°).
- Identity truth: `apps/web/public/rigs/trex-r0-v2/debug/approved-master-original.png`
  (anchor↔master link verified, aspect within 1.5%).
- Keep/crop directional table: brainstorm §7 round-1 log (corrected —
  jaw-rear = KEEP). Segmentation recipe: round-4 log (one chroma key
  yields anchor + 10 pieces + scale bar).

## Deliverables

1. **Slicer tool** (under `tools/`): chroma-key segment → identify pieces →
   strip/keep stubs per an authored per-piece manifest (id, each end
   keep|crop, scale, rotation — the neck carries −50°) → normalize
   piece → anchor → true master → emit a pack directory the existing
   `rigAssets` loader consumes (manifest.json, layers/, pattern-masks/ —
   masks generated procedurally via `pattern.ts`, as the originals were).
2. **Derived value variant** of each layer (desaturate per the proven
   hue-encoding test, `probe-r1-torso-desaturate-test.png`) stored in the
   pack for the D-023 runtime-paint work — even if the first rig ships
   painted.
3. **New species def** (e.g. `trex-pf-r0`) in `packages/illustrated-rig`:
   pivots/sockets/bounds from the slicer manifest; parts drawn OVER the
   closed core (new z-contract: limbs/tail/neck/head above the core where
   the old packs put legs/arms under a hole-cut torso — the pose evaluator
   is reused; only the def and z-order rules adapt).
4. `/rig-lab` gains the parts-first rig **beside** trex-r0-v2 (A/B is the
   point). Staging deploy via dreamhost-upload, slug `rig-ir0`.

## Definition of done

- Assembled parts-first T. rex idles in `/rig-lab`: breath, head/jaw,
  stride, tail sway — through the full motion envelope.
- Enclosed-hole scan (`tools/rig-scan`) flat across the pose sweep;
  silhouette/identity tolerance check vs the TRUE approved master passes
  and is recorded with numbers.
- Verify-loop screenshots (AGENT-GUIDE) committed; existing packs,
  goldens, `/lab`, genome untouched; all gates green.

## Out of scope (do not start)

Allosaurus re-author; the parts-first hybrid re-test (needs both packs);
closing D-021/D-023 (they close on assembled + mixed evidence); runtime
global paint (D-023 paint half) beyond storing the value variant;
Velociraptor and the per-archetype socket registry.
