# Createosaur v3 — Style Bible

The measurable spec for creature art. Every future renderer pass, and any
commissioned or authored art if we ever buy it, is judged against this file —
not against adjectives. Decided with the owner 2026-07-13 (D-019); redlines
land here in owner-approved commits.

Relationship to the other docs: GAME-DESIGN says what a creature *is*;
ARCHITECTURE says where it renders; ART-REFERENCES says what we may look at;
this file says what it must *look like* and how we check.

## 1. The register (what we are drawing)

**A modern field-guide reconstruction, rendered in flat-ish vector with real
value structure.** Think "the useful two-thirds of a Princeton-guide plate":
pigment countershading, form that turns, an animal that could stand in a
diagram — but built from morphable vector geometry, never painted texture.

- Register anchors (mood/proportion only — all-rights-reserved, **never trace,
  never embed, never img2img from them**): Gregory Paul's field-guide plates;
  Camp Cretaceous key art. Licensing rails per ART-REFERENCES.md apply to
  everything in this file.
- Adults read **naturalist and alert** — not snarling, not smiling, not
  babyish. Hatchlings/juveniles keep their cute scaling (see §4). The playful
  voice lives in copy and cosmetics, not in googly anatomy.
- Explicitly out of scope for the live render: painted/airbrushed realism,
  soft-focus edges, per-species hand illustration. That tier is delivered by
  the M5 generated **portrait** of a committed creature (D-019). The live
  slider never waits on it.

## 2. The acceptance test (how "done" is decided)

The bar is **full-frame max size**: every pure species rendered at its maximum
genome size in the 820×540 frame, judged at 100% scale on a desktop screen.
If it holds there, the lab default holds; 62px picker vignettes only owe
silhouette-and-slot readability, not facial charm.

Ritual (per AGENT-GUIDE verify loop; goldens regenerate only in a dedicated
commit):

1. Render all pure species at `size` max, plus the 10 archetype-exemplar
   pairwise mixes at default size, plus one hatchling per archetype. Both
   themes.
2. Walk the checklist below per creature. Any ✗ = not done. No averaging.
3. Attach the contact sheet to the PR.

Per-creature checklist:

- [ ] Face: eye, brow, mouth, nostril all present and inside the ranges in §4;
      no feature collapsed to an illegible blob or dot at this zoom.
- [ ] Mouth: no full-triangle "muppet teeth" row; carnivore gape within range;
      herbivore lip line clean.
- [ ] Limbs: posture matches the archetype table (§5); no S-curve on
      graviportal legs; legs and feet read as one silhouette (no appended-foot
      seam, no ankle cap-line).
- [ ] Junctions: no lightness seam where limb meets body (§6 continuity rule);
      far limbs stay behind the belly line, darker than near limbs.
- [ ] Value: dorsal-dark → ventral-light countershade present; the body turns
      (visible core-shadow band above the belly); no banding artifacts.
- [ ] Silhouette: clean at 62px (vignette check) — slot feature identifiable.
- [ ] Determinism gates green (same genome → identical SVG; sibling test).
- [ ] Chromebook budget: ≤ 300 SVG elements / ≤ 40 KB at `detail:'full'`;
      `'fast'` tier ≤ 180 elements. No SVG `filter` elements in anything the
      slider re-renders per tick — soft shading is built from gradients only.

## 3. The value system (light, color, line)

Five-value structure, in paint order (all gradients, no filters):

1. **Base countershade** — vertical 3-stop gradient *flipped from the M1b
   ramp*, at **half strength** (owner redline 2026-07-13): dorsal = species
   base darkened 10–14%, mid-flank = base, ventral = cream-leaning (base
   hue-shifted toward `#e8e2c8`, lightened 18–24%). The countershade should
   read as pigment on the animal, not repaint it — species palettes and
   pattern genes stay dominant. Runs spine-relative (reuse the M1b
   spine-following band machinery), so a rearing neck countershades
   correctly.
2. **Wrap light** — one radial gradient, center at upper-forequarter (~40% x,
   ~26% y of the body box), light tint ≤ 55% → 0 opacity, clipped to body.
3. **Core shadow** — a soft dark band (gradient, not filter) hugging the belly
   line just above the ventral cream, 12–20% opacity. This is what makes the
   form turn instead of striping.
4. **Ambient occlusion** — radial-gradient pools, 12–18% opacity: at each limb
   root, under the jaw/throat, where tail meets hips. 3–6 total.
5. **Markings** — species markings + dorsal dapple (§7) on top, then
   integument texture (M1b stipple/osteoderm systems, unchanged).

Line system (replaces the M1b hard black outline):

- Silhouette stroke: **self-toned, not black** — fill darkened 25–30%, width
  1.0–1.4 (was 3). The silhouette's "weight" now comes from a **rim-shadow
  band**: an inner edge darkening built as a clipped stroke of the silhouette
  path in a dark tone at 20–30% opacity, width 8–14, *rendered as gradient/
  stroke geometry, not a blur filter*.
- Interior anatomy lines (M1b contour/muscle system): keep, but opacity ≤ 0.2
  and width ≤ 1.2 — they whisper; value does the talking now.
- Feature strokes (brow, nostril, mouth, toe creases): 0.8–1.6 width, ink =
  self-toned dark, opacity 0.45–0.85 per §4.
- e2e literals that must survive any restyle: bone gradient stop `#e6dcc0`,
  frill `rotate(-24`. Renaming them means updating the e2e markers in the same
  PR — never silently.

## 4. Face construction (numbers, per head height H = authored skull height)

Baseline (all species, adults; hatchling ×1.6 / juvenile ×1.25 eye scaling
stays):

| Feature | Rule |
| --- | --- |
| Eye diameter | 0.14–0.18 × H (carnivores low end, herbivores/juveniles high end) |
| Eye center | 0.25–0.35 of snout length back from the brow-boss front; 0.55–0.65 × H up from the jawline |
| Iris/pupil | iris 0.60–0.66 × eye dia; pupil 0.30–0.36; **one** catchlight, upper-nasal quadrant, 0.22–0.28 × eye radius — the catchlight stays (it is the "alive" cue) |
| Socket | shadow ellipse ≤ 1.4 × eye dia, ≤ 20% opacity — a seat, not a panda patch |
| Brow | one stroke, 1.2 × feature weight; carnivores angled down-toward-snout 8–15°, herbivores 0–6°; never a cartoon arch above the skull line |
| Nostril | at 0.82–0.88 of snout length; 0.05–0.07 × H; crescent, not a dot |
| Mouth corner | ≤ 0.35 of snout length back from the nose tip (deeper = grin = derp) |
| Carnivore gape | 10–16° between jaws; upper lip **overhangs**: teeth show *tips only*, exposed ≤ 50% of tooth length |
| Teeth | count 4–8 scaled by head size, spacing/length jitter ±15% (seeded); tone `#e6dcc0`-family, **never pure white**; no even triangle picket row |
| Herbivore mouth | closed lip line + 1 short corner crease; beak per `snoutTip` as shipped |

Small-head rule (the brachiosaurus fix):

- All face features have **post-scale floors** — applied after the genome-size
  transform, in final viewBox units: eye radius ≥ 3.2, mouth stroke ≥ 1.1,
  nostril ≥ 1.8, brow ≥ 1.2. Floors are functions of genome only →
  deterministic.
- If final head height < 26 units, the face enters **simplified tier**: eye +
  lip line + nostril only (no teeth, no socket, no brow detail). The tier
  fades in over H = 22→26 by opacity ramp so slider morphs stay smooth —
  never a pop.
- Sauropods therefore read slightly big-eyed and gentle at small sizes. That
  is accepted, on-brand behavior, not drift.

Per-archetype skull notes (parametric `buildHead` stays the mechanism):

- **Theropod**: deep skull, strong brow boss, gape per table; rex heavier
  jaw than allo (data, not schema).
- **Sauropod**: rounded short cranium, closed mouth, high nostril; no teeth
  ever visible.
- **Ceratopsian**: beak leads, boss over eye, frill/horns seat on the skull
  (as shipped post-anatomy-pass).
- **Ornithopod**: flatter bridge, beak-forward, calm eye (high end of size
  range).
- **Armored**: small low head, wide jaw, simplified-tier styling even when
  size floors don't force it.

## 5. Limbs, junctions, feet (the "tacked-on" fixes)

Posture per archetype — the S-profile is **theropod/ornithopod only**:

| Archetype | Hind leg | Fore leg |
| --- | --- | --- |
| Theropod | digitigrade S-curve: knee at 0.40–0.48 of leg length, ankle high, metatarsus near-vertical | tucked two-claw arms (shipped) |
| Ornithopod | shallow S, ≤ 60% of theropod curvature | semi-quadruped column, light flex |
| Sauropod | **column**: leg axis within 4° of vertical through the hip; knee flex ≤ 8°; no S anywhere | column, elbow flex ≤ 6° |
| Ceratopsian / Armored | short columns, knee flex ≤ 12°, wide stance | short columns, slight outward bow allowed |

Blending: posture params are per-species data lerped like any morph vector —
a rex×brachi hybrid gets a legally intermediate leg, and the golden pairwise
fixtures must still pass the checklist.

Junction rules:

- Thigh root width ≥ 0.5 × body depth at the hip; root overpaint under the
  body clip (shipped M1b mechanism) stays.
- **Gradient continuity**: the limb's fill at its attachment row must sample
  the body gradient's value at that row — lightness delta across the seam
  ≤ 4 L\* points. (This kills the "different gradient direction" seam.)
- Far limbs: darkened 12–18% relative to near, and their silhouette may not
  cut outside the belly line by more than 0.1 × body depth; where they emerge,
  an AO pool (§3.4) seats them.

Feet:

- Leg + foot is **one continuous silhouette path** — ankle flows into the
  foot mass, toes are splits of that mass. No appended ellipse, no cap-line.
- Ground contact: flat sole segment ≥ 60% of foot length touching the ground
  line; per-foot contact shadow (small radial, 15–20%).
- Toes: theropod 3 + claws; sauropod round pad + 3 nail arcs; armored/
  ceratopsian hoofed nails (shipped look, unified into the new path).

## 6. What stays procedural vs authored vs generated (D-019)

- **Launch (M1c): 100% procedural.** No commissioned art, no authored-parts
  content program, no per-species illustration time. One renderer, all
  species, all hybrids — hybrid parity is inherent and non-negotiable.
- **M5 portraits are the realism layer**: img2img over the deterministic
  render of a *committed* creature, style brief = this file's register at
  full painterly quality. Portraits are outputs; they are never traced back
  into the vector art (ART-REFERENCES rails).
- **Authored topology-matched parts** (the PR #6 spike) stay a shelved,
  de-risked option for post-launch hero species — adopting them requires a
  new DECISIONS row and a species-data addition. Nothing in this file blocks
  that door; nothing opens it before launch.

## 7. Markings & texture addenda

- Dorsal dapple: seeded spots scattered along the dorsal ridge, radius 2–5,
  opacity ≤ 0.5 fading to 0 by 60 units below the ridge; count scales with
  body length (~30–60). Deterministic from `genome.seed` streams.
- Grain: optional patterned micro-stipple ≤ 10% opacity at `detail:'full'`
  only; fixed pattern tile (no per-render randomness).
- Existing pattern genes (stripes, rings, etc.) render *between* core shadow
  and texture, and must respect countershading (multiply toward the belly
  cream, never paint over it at full strength).

## 8. Change control

- Numbers in this file change only with owner sign-off (redline commits
  welcome); an implementing session may tune *within* stated ranges freely.
- Every art-affecting PR quotes which §2 checklist items its screenshots
  demonstrate, and regenerates goldens in a dedicated commit per AGENT-GUIDE.

Redline log:

- **2026-07-13, round 1 (owner, interactive review)**: §3 countershade set to
  half strength (10–14% dorsal / 18–24% ventral — was 18–24% / 30–38%).
  Confirmed as specced: §4 adult eye 0.14–0.18 × H; §4 carnivore narrow gape
  with tip-teeth (not closed-lipped, not gene-driven gape); §3 thin
  self-toned outline 1.0–1.4; §4 small-head floors + simplified-tier fade
  ("gentle big-eye giants").
