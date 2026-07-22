# Parts-first T. rex — first assembled rig (D-021 probe)

Captured 2026-07-22 from the static export, Chromium, stage extracted at native
1536×1024. The first **parts-first** creature: nine separately drawn pieces
(`tools/sheet-slicer` sliced the accepted round-4 sheet) overlaid on a single
closed core, versus `trex-r0-v2`'s twelve-layer master cut. Reproduce any state
at `/rig-lab?species=trex-pf&t=2500` with the listed sliders (idle off).

## States

| File | State | What to check |
|---|---|---|
| `01-neutral.png` | Neutral, all axes 0 | The assembly: nine bricks read as one T. rex; junctions at rest |
| `02-inhale-clench.png` | breath 1, jaw −8, head 0.5 | Core dorsal lifts; the open mouth clenches shut (jaw over the head's dark interior) |
| `03-look-up.png` | head +6 | Neck bends, skull hands off rigidly; head-end of the neck tracks the head |
| `04-stride.png` | stride 0.55, tail 0.55 | Whole-piece legs swing about the hip over the closed core; tail sways; feet keep contact |
| `05-stress.png` | every axis at its bound | The seam test on the maximal in-envelope pose |
| `06-pattern-bands.png` | bands @ 0.7 | Procedural stage-field pattern runs continuously body → tail (the §3 seam-stitcher) |
| `07-identity-underlay.png` | master underlay on | Assembled silhouette vs the TRUE approved master |
| `08-mesh-pivots.png` | mesh & pivot overlay | Core/neck/tail meshes; hip/shoulder/head/jaw/tail pivots |
| `09-ab-vs-master-cut.png` | parts-first above the master cut | A/B — the point of the probe |
| `10-page-light.png` · `11-page-dark.png` · `12-page-mobile.png` | Full page | Both themes, mobile width |

## Measurements

**Enclosed-hole scan** (`tools/rig-scan/scan.mjs`, transparent stage pixels
flanked by solid art within 12 px — slits inside the creature, not open
background):

| Config | neutral | inhale-clench | stride-fwd | stride-back | stress |
|---|---|---|---|---|---|
| **trex-parts-first** | 110 | 74 | 130 | 100 | 105 |
| pure-trex (master cut) | 476 | 152 | 268 | 274 | 269 |
| pure-allosaurus | 209 | 61 | 99 | 100 | 112 |

The parts-first counts are **flat across the pose sweep and below the master-cut
baseline everywhere** — the closed core carries no limb holes, so motion opens
essentially none (stride adds ~20 hairline slits at the whole-piece leg/core
contact, well inside a stable band; stress sits at neutral). This is D-021's
load-bearing claim measured on an assembled rig: what you see at neutral is what
you get in motion.

**Identity tolerance vs the TRUE approved master** (silhouette of the neutral
assembly vs `trex-r0-v2/trex-master-clean.png`, both 1536×1024):

- **bbox aspect 2.626 vs master 2.632 — Δ 0.2 %.** The assembled creature has the
  master's proportions (better than the on-sheet anchor's 1.5 %).
- bbox parts `45,233 1476×562` vs master `35,219 1495×568` — within ~1 % on every
  edge.
- silhouette IoU 0.70; the parts fill 80 % of the master outline and 15 % sit
  just outside it — the residual is independent per-part palette/edge drift (the
  ~14 % batch drift the probe logged) plus a slightly thinner, shorter tail, not
  a proportion or placement error. Contour tolerance replaces byte-equality per
  the D-021 reframe.

## What stays open

The junctions carry honest parts-first characteristics the A/B makes visible: a
faint throat sliver where the tube neck meets the head, near-vertical core-edge
seams (the closed core adds intra-body seams the master never had), and a
lighter/warmer palette than the master. These are exactly the D-021/D-023 items
the probe exists to surface — they close on the mixed, painted, re-authored
evidence, not on this single assembled rig. Existing packs, goldens, `/lab` and
the genome are untouched.
