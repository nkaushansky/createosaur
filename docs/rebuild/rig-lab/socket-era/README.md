# Socket-era T. rex — first assembled rig under the D-024 contract

Captured 2026-07-24 from the static export, Chromium, stage extracted at
native 1536×1024. The first creature authored to the **socket-era contract**
(`IR-LESSONS.md`): grayscale value parts generated onto socket templates
(Template S), sliced by `tools/sheet-slicer`, assembled over the closed core
by the parts evaluator. Reproduce any state at
`/rig-lab?species=trex-sock&t=2500` with the listed sliders (idle off).

The rig ships **grayscale by design** — the layers are the value art; color
and pattern arrive with the D-023 runtime-paint pass, which is the other
half of the kill test (alongside Triceratops).

## States

| File | State | What to check |
|---|---|---|
| `01-neutral.png` | Neutral, all axes 0 | Nine socket-cut parts read as one T. rex; junctions at rest |
| `02-inhale-clench.png` | breath 1, jaw −8, head 0.5 | Core dorsal lifts; open mouth clenches shut over the head's dark interior |
| `03-look-up.png` | head +6 | Neck bends, skull hands off rigidly |
| `04-stride.png` | stride 0.55, tail 0.55 | Whole-piece legs swing over the closed core; feet keep contact |
| `05-stress.png` | every axis at its bound | The seam test on the maximal in-envelope pose |
| `06-pattern-bands.png` | bands @ 0.7 | Procedural stage-field pattern runs body → tail over value art |
| `07-identity-underlay.png` | master underlay on | Assembled silhouette vs the value master |
| `08-mesh-pivots.png` | mesh & pivot overlay | Core/neck/tail meshes; hip/shoulder/head/jaw/tail pivots |

## Measurements

**Identity tolerance vs the value master** (frame-registered to the approved
painted master; `tools/sheet-slicer/identity.mjs`):

- silhouette **IoU 0.735**; the assembly covers **87.6 %** of the master
  outline, 18 % sits outside it (mostly the deliberately thicker tail root
  and the head cover flap).
- bbox assembly `38,203 1498×583` vs master `35,220 1494×567`; aspect 2.569
  vs 2.635 — **Δ 2.5 %**.
- Every number improves on the parts-first probe (IoU 0.687 / 80 % /
  Δ 5.7 %) — the socket contract assembles tighter than free-form sheets.

**Enclosed-hole scan** (`tools/rig-scan/scan.mjs`):

| Config | neutral | inhale-clench | stride-fwd | stride-back | stress |
|---|---|---|---|---|---|
| **trex-socket** | 449 | 161 | 321 | 322 | 273 |
| pure-trex (master cut) | 476 | 152 | 268 | 274 | 269 |

Counts **fall or hold as motion increases** (neutral 449 → stress 273):
motion opens nothing, the closed-core claim again. The absolute baseline
sits at the master-cut rig's level (the richly textured value art and the
open mouth/arm crevices carry an intrinsic slit count) rather than the
smoother parts-first probe's.

## Slicer learnings from the first Template S run

- The model **redraws the template furniture** (scale bar came back ~300 px
  vs the authored 200), so normalization is against master anatomy, not the
  bar — the value master being frame-registered to the painted master made
  that easy.
- Guides land ON the art: cut dashes and size labels are painted over hide.
  The slicer now keys magenta globally and **inpaints any keyed pixel that
  is enclosed by a component** (row/column sandwich), which healed every
  dash and label without per-piece config. Template v2 should still move
  labels off the art cells.
- New per-piece `feather` (edge alpha ramp) softens the head's rear cover
  flap where it lies over the neck — the flap contract works, it just needs
  a soft landing.

## What stays open

The kill test's other half: **runtime paint** (D-023) on this rig, and
**Triceratops** authored to the same contract (quad template), then the
cross-archetype hybrid judged as a hybrid. Existing packs, goldens, `/lab`
and the genome are untouched.
