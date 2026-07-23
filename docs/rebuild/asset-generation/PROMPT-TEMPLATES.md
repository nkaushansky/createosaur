# Prompt Templates

These are copy-paste templates for future ChatGPT threads.

---

## Template A — Core style brief

Use this block in every future species thread.

```text
Create an editorial paleontology illustration in the same visual family as the approved Createosaur T. rex rig reference.

Style target:
- semi-realistic 2D digital illustration
- natural-history / field-guide influence
- more realistic than cartoon, but not photoreal and not movie CGI
- painted, organic, anatomically grounded
- restrained, believable expression
- no derpy face, no exaggerated smile, no children's-book simplification
- crisp silhouette, thoughtful volume, subtle texture, readable forms
- skin should show believable reptilian texture, wrinkles, folds, and value variation
- color treatment should support later recoloring and pattern overlays
- keep the illustration suitable for a deterministic 2D deformation rig

Rendering language:
- clean side/profile presentation
- controlled lighting
- limited neutral or earthy palette
- no scene clutter
- no decorative typography
- no fake labels

Production intent:
The goal is a clean, riggable creature design that can later be separated into anatomical layers for a 2D interactive rig.
```

---

## Template B — Master illustration

```text
Using the attached approved Createosaur T. rex references as the style and pipeline anchor, create a clean full-body profile illustration of [SPECIES NAME] in the same semi-realistic editorial paleontology style.

Target species: [SPECIES NAME]
Archetype/body plan: [ARCHETYPE]
Facing direction: [LEFT or RIGHT]

Requirements:
- full-body side/profile
- neutral standing pose
- plain light neutral background
- no labels
- no text
- no scenery
- same visual family as the approved T. rex
- more realistic than cartoon
- not photoreal
- not childish
- restrained neutral expression
- small, believable eye
- mouth closed or nearly closed
- subtle skin texture
- clean silhouette
- rig-friendly anatomy and presentation

This should serve as the approved master illustration for later exact layer extraction.
```

---

## Template C — Layer extraction

```text
Use the approved master illustration as the only visible pixel source. Preserve the exact visible design and do not reinterpret the anatomy.

Target species: [SPECIES NAME]

Create a controlled 2D rig layer extraction.

Required breakdown:
1. far hind shank and foot
2. far hind thigh
3. near hind shank and foot
4. near hind thigh
5. far forelimb
6. near forelimb
7. tail
8. pelvis / rear body
9. torso / main body
10. neck
11. upper head / skull
12. lower jaw

Requirements:
- preserve the exact visible silhouette at the neutral pose
- show the fully assembled creature and the isolated layers
- keep full-canvas alignment
- manually paint hidden overlap beneath adjoining parts
- no redesign
- no environment
- no fake labels
- no infographic clutter
- no trait pieces unless explicitly requested
```

---

## Template D — Pattern masks

```text
Using the approved dinosaur layer pack, generate local grayscale per-layer pattern masks for a rigged illustrated dinosaur.

Target species: [SPECIES NAME]

Required mask types:
- solid
- mottle
- bands

Requirements:
- masks must be clipped to each exact anatomical layer
- masks should align in the neutral assembled pose
- masks should move with their own layers during rig deformation
- do not create one screen-space pattern for the entire animal
- clean grayscale presentation
- no fake labels
- no decorative poster styling
```

---

## Template E — Trait pack

```text
Using the approved master dinosaur and layer-pack style as the base, create a rig-friendly attachment trait pack for [TRAIT SPECIES].

Base species: [BASE SPECIES]
Trait species: [TRAIT SPECIES]

Create isolated trait pieces only, in the same illustration family.

Examples may include:
- frill front
- frill back
- near horn
- far horn
- nose horn
- sail
- crest
- plates
- spikes
- feather overlays
- tail club

Requirements:
- exact same visual family as the approved rig
- believable fit to the base dinosaur
- front/back split pieces where necessary
- attachment shadow pieces where necessary
- preserve important base features such as eye visibility
- no full redesign unless explicitly requested
- no fake labels
```

---

## Template F — Full future-thread starter

```text
I want to create a new Createosaur illustrated-rig species asset in the same family as the approved T. rex rig.

Please follow this workflow:

Step 1:
Generate a clean approved master illustration for [SPECIES NAME]:
- full body profile
- neutral pose
- plain background
- no text
- no labels
- same editorial semi-realistic paleontology style as the approved T. rex
- no derpy or childish features
- rig-friendly silhouette

Step 2:
After approval, generate a controlled anatomical layer extraction from that exact design:
- preserve exact visible appearance
- separate into riggable layers
- include hidden overlap beneath adjoining parts
- show both assembled and separated views
- no redesign

Step 3:
Generate local per-layer grayscale pattern masks for:
- solid
- mottle
- bands

Step 4:
If requested later, generate a trait attachment pack.

This is a production-art pipeline task, not just concept art.
```

---

## Template G — Parts contact sheet (v2 — SUPERSEDED by Template S)

> **Superseded 2026-07-23** for all new species authoring by **Template S**
> below (the D-024 socket-era contract; verdict in `../IR-LESSONS.md`:
> independently generated *painted* parts assemble as a collage). Kept for
> the probe record only — do not generate from this template.

Status: **v2, probe use** (`../IR2-JUNCTION-BRAINSTORM.md` §7 round-2 log,
owner call 2026-07-22). Round-1/2 proved parts-first as the ARCHITECTURE;
v2 folds in the panel's fixes so the next sheet is cleanly *sliceable*.
Concept reference (and its flaws) is `reference-parts-sheet-trex-chatgpt.png`
(critique in brainstorm §8); the two probe sheets are
`probe-trex-parts-sheet-r1.png` (painted — baked the mouth shut) and
`-r2-neutral.png` (redrew the tail straight). Do NOT close D-021/D-023 on a
sheet alone — that happens on the assembled, mixed rig.

**What changed from v1 (why each line exists):**
- **Single closed torso-through-pelvis CORE** (owner call): the torso/pelvis
  split was a cut artifact the master never had; merging it removes the
  mid-flank seam. Nine pieces, not ten.
- **Generate PAINTED, not neutral.** We derive value in-repo by desaturating
  (proven: the blotches are hue-encoded, §7 log) and QA identity against the
  master's colour/pattern. Runtime pattern comes from `pattern.ts`
  procedurally — so the drift-prone whole-body pattern-overlay row is DROPPED.
- **Mouth-open and tail-curvature are now hard, checked asks** — the exact
  two defects that made r1 and r2 unsliceable.
- **Identity lock** (teeth, tubercles, texture density) — round-2 found a
  silent batch drift (banana teeth → croc pegs) a silhouette check misses.
- **Chroma-key background** — pale stubs (lum 254–255) got eaten by a
  luminance background key at the joints; a saturated background separates
  them by hue.

**Thread hygiene:** attach ONLY the approved master. Never attach a previous
parts sheet or layout example — an image that already "answers" the request
dominates the text and gets copied, mistakes included. WE author the
machine-readable per-piece manifest (piece id, each end keep|crop, expected
scale vs the true master, pose lock) in-repo; do not ask the generator for it.

```text
Using the attached approved Createosaur [SPECIES NAME] master illustration
as the exact identity, style, colour, pattern, lighting and scale anchor,
create a PARTS CONTACT SHEET of the SAME INDIVIDUAL animal — every piece
drawn separately and complete, ready to be reassembled by overlapping at
defined joint lines. This is the same animal taken apart, NOT a redesign:
match the master's exact teeth (large and blade-like — never shrunk or
rounded), skull bumps/tubercles, skin texture density, colour and pattern.

TWO RULES THAT OVERRIDE EVERYTHING, check them before finishing:
1. MOUTH STAYS OPEN exactly as the master — upper and lower tooth rows both
   visible, the dark mouth interior painted on the UPPER HEAD piece so the
   lower jaw hinges open in front of it. Never draw the mouth closed.
2. Each hind leg is ONE COMPLETE PIECE INCLUDING ITS ENTIRE THIGH, from
   inside the hip down through the foot and claws. The thigh is never part
   of the body. A leg without its thigh means the sheet is wrong.

The sheet contains EXACTLY NINE PIECES plus the anchor, and nothing else:
neck, body core, upper head, lower jaw, near arm, far arm, near hind leg,
far hind leg, tail. Do NOT add other rows or items — no eye/detail insets,
no light-shadow study, no pattern overlay, no trait add-ons, no alternate
poses, no assembled preview.

BACKGROUND: a flat saturated CHROMA-KEY green (#00b140), edge to edge, behind
everything — not paper, not gray. Over it a faint thin registration grid of
uniform squares.

SCALE: every piece AND the anchor at the exact same scale (same pixels per
metre) — measure against the anchor, no per-piece zoom anywhere. Draw a short
labelled scale bar beside the anchor.

ROW 1 — anchor: the approved master illustration, reproduced as exactly as
you can, unchanged.

ROW 2 — BODY CORE: ONE complete closed piece of hide running from the base
of the neck to the root of the tail (torso and pelvis together, no seam
between them). Plain believable hide across the shoulder, belly and hip —
the arms, legs, tail and neck attach OVER or BEHIND this hide, never inside
it. No holes, no openings. Leave a plain hide margin at the neck base and
the tail root.

ROW 3 — UPPER HEAD and LOWER JAW, two separate labelled pieces, mouth open
per rule 1 (dark interior on the upper head).

ROW 4 — LIMBS, four separate labelled pieces: near arm and far arm (shoulder
to claw tips), near hind leg and far hind leg (each with its full thigh per
rule 2). Draw the near and far piece of each pair IDENTICAL in value — do
not darken the far one; depth shading is added later.

ROW 5 — TAIL: one complete piece from the tail root to the fine tip, drawn
in the master's exact curvature and length — a thick curved taper, NOT
straightened, NOT stretched into a thin needle.

SOCKET STUBS: every piece that attaches to another ends at its joint, then
continues PAST the joint with a plain smooth flesh stub about a tenth of the
piece's length — no scales or silhouette detail on the stub, it only exists
to be hidden under the neighbouring piece. Mark the joint with a thin dotted
line across the stub. Clean socket lines with stubs — never ragged tears,
never painted-in shadow gaps, never holes.

Label each piece in small plain text ABOVE it, never touching artwork.
Generous empty space between pieces — nothing overlaps on the sheet. No
decorative typography, no scenery, no extra annotations. Highest resolution
you can.
```

Follow-up 1 — correct a single bad piece (same thread):

```text
Regenerate only [PIECE NAME] on the same sheet conventions: same scale, same
lighting, same style, mouth open / full thigh / tail curvature as applicable,
severed at its joint with its plain dotted-line stub. Do not change any other
piece.
```

Follow-up 2 — the anchor drifted from the true master (same thread):

```text
Compare your ROW 1 anchor to the attached master: [SPECIFIC DRIFT, e.g. the
teeth are too small and round, the skull has lost its bumps]. Redraw every
piece to match the master exactly on that point. It is the same individual.
```

**In-repo, not in the prompt:** derive the neutral-value pieces by
desaturating the sliced painted pieces and suppressing residual tonal
mottle; author the runtime pattern as a `pattern.ts` stage-space field tuned
to the master (the sheet carries no pattern layer); normalise every piece to
the TRUE master (not the on-sheet anchor) with a proportion/silhouette gate
that can reject-and-re-roll a single piece; keep the keep/crop table and
per-piece expected scale in the manifest.

### Template G v3 — split across focused sheets (owner call, 2026-07-22)

The trex-pf-r0 round-4 → round-5 fixer proved that one crammed page overlooks
the junction-critical pieces: the neck came back a flat tube and the head lost
its rearward cover, and the front third read as a floating head. Regenerating
those pieces on their own, focused sheets fixed it immediately. So for every new
species, author **one sheet per group**, each a separate Template G generation:

1. **Full master** (Template B) — approved first; the identity/QA truth every
   sheet is conditioned on.
2. **Head-assembly sheet** — anchor + upper head (with a *generous rearward
   cheek/neck cover* — this is the attachment contract, the piece round-4 got
   wrong), lower jaw, neck (drawn in the assembled diagonal with real
   nape-to-throat depth, not a flat tube). Mouth-open + cover contracts live
   here.
3. **Body + limbs sheet** — anchor + body core, both hind legs (full thighs),
   both arms, tail.
4. **Trait sheet(s)** as the archetype needs (frill/horns, plates/club, crest,
   feather overlays).

**Non-negotiable:** every sheet carries the **anchor (a reproduction of the
master) + the 1-metre scale bar** on the same chroma-key background and the same
Template A style block. That is what lets the slicer normalise each sheet
independently to the same master scale — parts-first places each piece
piece → true master, never piece → piece, so sheets never have to register with
*each other*, only with the master. `tools/sheet-slicer` routes pieces to sheets
via a per-piece `sheet` field (see its README). Regenerate one bad piece by
re-rolling only its sheet; nothing downstream re-cuts.

## Template S — Socket-era species authoring (D-024, ACTIVE)

Status: **the authoring path for all new species** (owner call, 2026-07-23;
contract + rationale in `../IR-LESSONS.md`). Three generations per species,
in order, each a fresh ChatGPT image request:

1. **S-M — grayscale value master.** The identity + register anchor. Owner
   eyeballs it before the sheets are generated (this is also where the art
   register gets judged — see the STYLE REGISTER line).
2. **S-A — head-assembly sheet** onto `socket-template-a-v1.png`.
3. **S-B — body & limbs sheet** onto `socket-template-b-biped-v1.png`
   (bipeds) or `socket-template-b-quad-v1.png` (quadrupeds).

Download each result full-size as PNG and drop it into
`docs/rebuild/asset-generation/` named `<species>-value-master.png`,
`<species>-sheet-a.png`, `<species>-sheet-b.png`. Claude slices, assembles,
and puts the *hybrid* on screen for judgment. Compliance does not need to be
pixel-perfect — the slicer measures the scale bar and snaps near-miss socket
cuts; the template exists to prevent the *large* mismatches that read as
gaps. Do not attach any painted master or older parts sheet to S-A/S-B —
only the template + the approved S-M value master (color would leak back in,
and old sheets get copied, mistakes included).

### S-M — grayscale value master

> Attach: the species' approved painted master if one exists (T. rex,
> Allosaurus); otherwise nothing — the text carries the species.

```text
Create a GRAYSCALE VALUE master illustration of [SPECIES — e.g.
"an adult Tyrannosaurus rex" / "an adult Triceratops horridus"] for a
field-guide character sheet. If an image is attached, it is the exact
identity reference: same individual, same proportions, same head details
and skin texture — but rendered entirely in grayscale.

STYLE REGISTER: clean stylized naturalism — crisp confident shapes, simple
two-step shading plus soft ambient occlusion, scale/skin texture suggested
rather than micro-rendered. Premium animated-series model sheet, not
painterly realism and not a cartoon.

HARD RULES, check each before finishing:
1. ZERO color. Pure grayscale only — no tint, no sepia, no colored eye.
2. One light: soft ambient with a faint upper-left key. NO cast shadows on
   the ground, no rim light, no background scenery.
3. Full standing side view FACING LEFT, neutral stance, all feet planted,
   tail carried naturally. The whole animal fits with a small margin.
4. Mouth PARTIALLY OPEN — both tooth rows / beak edges visible, dark mouth
   interior visible (a closable jaw is cut from this later).
5. Mid-gray body value overall: near-black only in the mouth interior,
   pupil and claws; near-white only on teeth and top highlights.
6. Background: flat saturated chroma-key green (#00ff00), edge to edge.
```

### S-A — head-assembly sheet

> Attach: `socket-template-a-v1.png` + the approved `<species>-value-master.png`.

```text
The first attached image is a TEMPLATE with three labeled dashed cells and
magenta socket-cut guides. The second is the approved grayscale value
master — the exact identity reference. Fill the template's cells with the
SAME INDIVIDUAL's parts, drawn separately: UPPER HEAD in the upper-left
cell, LOWER JAW in the lower-left cell, NECK in the right cell.

Keep the template exactly as given: same canvas size, green background,
all magenta guides, the bottom strip (anchor, scale bar, value ramp) and
the green cell borders stay untouched and uncovered. Draw INSIDE the
cells; never let a part cross a cell border.

RULES, check each before finishing:
1. Grayscale value art only, matching the master's style, values and
   details exactly (same teeth/beak, same head ornament, same texture).
2. Each part ends FLUSH on its magenta cut line at exactly that cut's
   size, with a simple straight cut end — no torn edges, no fade-outs.
3. UPPER HEAD: skull only, no lower jaw, mouth interior painted dark so a
   separate jaw can hinge over it. Behind its rear cut line, ADD a soft-
   edged neck-cover flap extending rearward (it will overlap the neck).
4. LOWER JAW: complete open-gape jaw; NOTHING extends past its root cut
   (it tucks under the skull).
5. NECK: one deep nape-to-throat wedge running between its two cut lines,
   head end upper-left, body end lower-right — never a thin tube.
6. All parts side view FACING LEFT, sized consistently with the master
   (the template's scale bar equals the master's scale).
```

### S-B — body & limbs sheet

> Attach: `socket-template-b-biped-v1.png` (theropods etc.) or
> `socket-template-b-quad-v1.png` (ceratopsians, sauropods, armored) + the
> approved `<species>-value-master.png`.

```text
The first attached image is a TEMPLATE with labeled dashed cells and
magenta socket guides. The second is the approved grayscale value master —
the exact identity reference. Fill the template's cells with the SAME
INDIVIDUAL's parts, drawn separately: CORE, TAIL, both FORELIMBS, both
LEGS, each in its labeled cell.

Keep the template exactly as given: same canvas size, green background,
all magenta guides, the bottom strip (anchor, scale bar, value ramp) and
the green cell borders stay untouched and uncovered. Draw INSIDE the
cells; never let a part cross a cell border.

RULES, check each before finishing:
1. Grayscale value art only, matching the master's style, values, texture.
2. CORE: the torso through the pelvis as ONE completely CLOSED shape — no
   neck, head, limbs or tail, and absolutely no holes or cut-outs. Where
   parts will attach, shade smooth plain hide sized to the socket list
   printed in the cell.
3. Each limb is COMPLETE: the entire thigh/shoulder down through the foot
   and claws, one piece. Each part ends flush at its magenta guide at
   exactly that size.
4. TAIL: complete root-to-tip, with a thick muscular root at the guide
   size, tapering naturally.
5. FAR-side limbs are whole parts too (slightly darker overall value than
   the near limbs, as on the master).
6. All parts side view FACING LEFT, sized consistently with the master.
```

### Species notes

- **T. rex** (kill-test species 1, biped template): S-M attaches the
  approved painted master (`apps/web/public/rigs/trex-r0-v2/debug/
  approved-master-original.png`) so identity carries over exactly.
- **Triceratops** (kill-test species 2, quad template): no painted master
  exists — S-M works from text. The frill may extend past the head's rear
  collar cut as a soft-edged cover flap (it is the natural neck-junction
  cover, called out in `../IR-LESSONS.md`); the beak replaces tooth rules;
  horns belong to the UPPER HEAD part.

### What Claude verifies on every returned image (owner doesn't need to)

Chroma ≤ ~5 outside the green/magenta (truly grayscale) · scale-bar length
vs template (re-normalization factor) · each cut end within ~15 px of its
guide (slicer snaps the rest; bigger misses → re-roll that sheet) · closed
core (no interior transparency after keying) · style/value match to S-M by
eye and value-histogram vs the ramp.
