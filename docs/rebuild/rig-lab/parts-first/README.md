# Parts-first T. rex — first assembled rig (D-021 probe)

Captured 2026-07-22 from the static export, Chromium, stage extracted at native
1536×1024. The first **parts-first** creature: nine separately drawn pieces
overlaid on a single closed core, versus `trex-r0-v2`'s twelve-layer master cut.
Reproduce any state at `/rig-lab?species=trex-pf&t=2500` with the listed sliders
(idle off).

> **Fixer round (round-5, two passes).** The round-4 sheet crammed all ten
> pieces on one page and shortchanged the junction-critical ones: a flat-tube
> neck and a head with no rearward cover, so the front third read as a floating
> head over a pipe. Pass one gave the head a generous rear-edge cover (sheet B,
> the IR1 attachment contract). Owner review of that rig then caught what the
> metrics missed — the neck was still too slim to bridge, the jaw's rear stub
> hung out, and the tail was drawn far too slender. Pass two fixed the junctions
> without a new sheet: the **deep neck is spliced from sheet A** through the
> slicer's per-piece `sheet` sourcing (the body/head/jaw/limbs/tail stay from
> sheet B), the **tail is scaled non-uniformly taller** so it reads as a T. rex
> tail rather than a whip, and generous overlaps hide the core's barrel ends.
> This is the first real use of multi-sheet assembly and a direct validation of
> it: pieces from two sheets assemble cleanly because each normalizes to the
> master, never to the other sheet. **Standing policy:** author future species
> across focused sheets (head-assembly / body+limbs / traits), one per group.

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
| **trex-parts-first** | 98 | 85 | 102 | 100 | 57 |
| pure-trex (master cut) | 476 | 152 | 268 | 274 | 269 |

The parts-first counts are **flat across the pose sweep and far below the
master-cut baseline everywhere** — the closed core carries no limb holes, so
motion opens essentially none (neutral 98 → stride 102 is +4; stress sits
*below* neutral). This is D-021's load-bearing claim measured on an assembled
rig: what you see at neutral is what you get in motion.

**Identity tolerance vs the TRUE approved master** (silhouette of the neutral
assembly vs `trex-r0-v2/trex-master-clean.png`, both 1536×1024):

- silhouette **IoU 0.687; the parts fill 80 % of the master outline**, 17 % sit
  just outside it. bbox parts `37,217 1432×577` vs master `35,219 1495×568`.
- bbox aspect 2.482 vs master 2.632 — Δ 5.7 %, *looser* than the earlier rigs
  and deliberately so: the metric is necessary, never sufficient. The
  broken-looking round-4 rig scored Δ 0.2 % because its small head and thin whip
  tail matched the bbox exactly; this rig's coherent deep neck adds height and
  its properly *thick* tail is shorter than a whip, which costs bbox aspect
  while raising IoU/coverage. A creature that reads as a T. rex beats a better
  bounding box — contour tolerance and the eye decide, per the D-021 reframe.

## What stays open

With the deep-neck splice and the thickened tail the rig reads as a coherent,
connected T. rex — head, neck, body, and tail flow as one animal through the
motion sweep. The junctions now carry only faint parts-first characteristics: a
small tan throat sliver under the jaw, and a slightly lighter/warmer palette
than the master. These are the D-021/D-023 items the probe exists to surface —
they close on the mixed, painted, re-authored evidence, not on this single
assembled rig. Existing packs, goldens, `/lab` and the genome are untouched.
