# IR1 hybrid mixing PoC — visual review matrix (`/rig-lab` Hybrid mix)

Captured 2026-07-22 from the static export, Chromium, stage extracted at
native 1536×1024. Every state is reproducible: `?mix=body:trex,head:allosaurus`
selects the config (groups omitted follow the body), `?t=<ms>` freezes the
clock, and the pose sliders are set to the values listed. The mechanism under
review: cross-pack part swapping over the two v2 packs' shared framing —
pure translation anchors, no scaling, no seam healing, no hole backing.

## States

| File | Config / state | What to check |
|---|---|---|
| `hybrid-01-allo-head-neutral.png` | Allosaurus head on T. rex, neutral | The marquee. Cover-anchored head↔neck junction, silhouette continuity |
| `hybrid-02-allo-head-clench.png` | Same, breath 1 + jaw −8° | Donor jaw clenches into its own pack's hidden overlap on the base body |
| `hybrid-03-allo-head-stride.png` | Same, stride +1 | Junction holds through the base body's full walk pose |
| `hybrid-04-allo-head-bands.png` | Same, bands @ 0.75, inhale | Pattern masks ride their own layers across the species boundary |
| `hybrid-05-allo-head-pivots-debug.png` | Same, mesh & pivot overlay | Donor head/jaw pivots carried to base space; body pivots are the base's |
| `hybrid-06-rex-head-neutral.png` | T. rex head on Allosaurus | The reverse marquee: same cover anchor, opposite direction |
| `hybrid-07-trex-legs-on-allo-stride.png` | T. rex legs on Allosaurus, stride +1 | Ground-contact anchor: feet plant on the base ground line; complete donor far leg fills the base's rear opening; haunch-top wedge (see findings) |
| `hybrid-08-allo-tail-on-trex-sway.png` | Allosaurus tail on T. rex, sway 1 | Donor tail deforms under the base body's field: root pinned, tip sweeps |
| `hybrid-09-full-swap-neutral.png` | Every part from Allosaurus on the T. rex body | All four donor groups at once |
| `hybrid-10-full-swap-stress.png` | Same, every axis at its bound | The deliberate seam test on a maximal mix |
| `hybrid-11-page-mix-panel.png` | Full page, marquee | Mix panel UI: per-part pickers, quick presets, findings copy |

## Measurements (`measurements.json`)

Enclosed-hole scan (`tools/rig-scan/scan.mjs`): transparent stage pixels
flanked by solid art within 12 px on all four sides — slits and tears inside
the creature, not open background. Pure-species rows are the baselines
(their natural crevices: tooth gaps, leg folds).

The result that matters: **every mix's counts stay flat-or-baseline-shaped
across the whole pose sweep** — neutral → clench → stride ±1 → stress adds
no motion-opened holes over what the config shows at rest. Two examples:
`allo-tail-on-trex` sits at exactly baseline+8 in all five poses;
`allo-head-on-trex` (206/47/87/93/93) reads *below* pure T. rex everywhere
because the allosaurus head carries fewer tooth-gap crevices. Cross-pack
junctions are static: what you see at neutral is what you get in motion.

The scan deliberately measures slits only. Area mismatches — a donor part
smaller than the opening the base composite leaves for it — are wider than
the 12 px window and are documented by the screenshots instead.

## Findings (what shared framing gives, and where it stops)

1. **The head is the strong swap, both directions.** With the cover anchor
   (donor head-upper's rear edge lands on the base head's rear edge, so the
   base neck's cut edge stays concealed; atlas height keeps the vertical),
   the junction is continuous at neutral and through every pose. The first
   attempt anchored atlas-on-atlas and left a ~50 px paper gap — pivots are
   motion geometry, not attachment geometry. Anchor on the art's cover
   contract; articulate about the donor's carried pivot.
2. **Legs donate complete-art → occluded-art, not the reverse.** The T. rex
   far leg is fully painted and fills the Allosaurus's rear leg opening; the
   Allosaurus far leg is 96 % hidden in its own master (204 visible px), so
   on the T. rex body the base's far-leg opening shows paper. A pack can
   only donate what its master actually painted.
3. **Ground-contact anchoring beats hip anchoring for legs.** The packs
   stand ~35 px apart; anchoring feet to the base ground line keeps every
   hybrid planted (the single strongest plausibility cue) at the cost of a
   haunch-top wedge when the donor thigh rides lower than the base's leg
   opening (`hybrid-07`). The wedge reads as flank shadow; floating feet
   read as broken.
4. **Slim donor parts leave base-opening slivers.** The Allosaurus tail on
   the T. rex pelvis leaves the top of the T. rex tail opening uncovered — a
   static wedge, constant through the sway sweep. The real fix is IR2-class
   (dominant-body hole backing or per-species junction cover slices), not
   transform tuning.
5. **Patterns stay per-layer registered** across the boundary (each layer
   uses its own pack's masks); palette and texture density step at the
   junction because the two masters were painted independently — the
   strongest argument for palette-harmonized masters in future pack specs.
6. **Motion composition works unmodified**: the base body's breath field,
   neck program, stride clock and tail field drive donor parts through their
   own pivots and seam-tuned amplitudes with no per-pair tuning. Jaw range
   comes from the head pack, stride from body∩legs.
