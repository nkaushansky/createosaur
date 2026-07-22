# Parts-first T. rex — first assembled rig (D-021 probe)

Captured 2026-07-22 from the static export, Chromium, stage extracted at native
1536×1024. The first **parts-first** creature: nine separately drawn pieces
(`tools/sheet-slicer` sliced the **round-5 head-cover sheet**) overlaid on a
single closed core, versus `trex-r0-v2`'s twelve-layer master cut. Reproduce any
state at `/rig-lab?species=trex-pf&t=2500` with the listed sliders (idle off).

> **Fixer round (round-5).** The round-4 sheet crammed all ten pieces on one
> page and shortchanged the two junction-critical ones: the neck came back a
> flat tube and the upper head lost its rearward cheek/neck cover, so the front
> third read as a floating head over a pipe. Two focused re-gen passes fixed it
> — sheet A deepened the neck, sheet B gave the head a generous rear-edge cover
> (the IR1 attachment contract). Because parts-first places each piece
> piece → true master (never piece → piece) and both sheets carried the anchor,
> the pieces were interchangeable; the covering head (sheet B) alone carried the
> junction, so `trex-pf-r0` ships from it. **Lesson, now standing policy:** author
> future species across focused sheets (head-assembly / body+limbs / traits),
> one image per group. The slicer supports per-piece `sheet` sourcing for it.

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
| **trex-parts-first** | 98 | 95 | 100 | 99 | 60 |
| pure-trex (master cut) | 476 | 152 | 268 | 274 | 269 |

The parts-first counts are **flat across the pose sweep and far below the
master-cut baseline everywhere** — the closed core carries no limb holes, so
motion opens essentially none (neutral 98 → stride 100 is +2; stress sits
*below* neutral). This is D-021's load-bearing claim measured on an assembled
rig: what you see at neutral is what you get in motion.

**Identity tolerance vs the TRUE approved master** (silhouette of the neutral
assembly vs `trex-r0-v2/trex-master-clean.png`, both 1536×1024):

- **bbox aspect 2.556 vs master 2.632 — Δ 2.9 %.** bbox parts `37,217 1475×577`
  vs master `35,219 1495×568` — within ~2 % on every edge. (Note the metric is
  necessary but not sufficient: the *broken-looking* round-4 rig scored Δ 0.2 %
  because its small head matched the bbox exactly — a coherent front third that
  reads as a T. rex is worth a couple of points of bbox aspect.)
- silhouette IoU 0.67; the parts fill 76 % of the master outline and 15 % sit
  just outside it — the residual is independent per-part palette/edge drift (the
  ~14 % batch drift the probe logged), the larger covering head sitting slightly
  proud of the master head, and a marginally shorter tail. Contour tolerance
  replaces byte-equality per the D-021 reframe.

## What stays open

With the round-5 head-cover fix the front third reads as a coherent T. rex; the
junctions now carry only faint parts-first characteristics the A/B makes
visible: a thin lighter band where the neck base meets the core front,
near-vertical core-edge seams (the closed core adds intra-body seams the master
never had), and a lighter/warmer palette than the master. These are exactly the
D-021/D-023 items the probe exists to surface — they close on the mixed, painted, re-authored
evidence, not on this single assembled rig. Existing packs, goldens, `/lab` and
the genome are untouched.
