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

## Template G — Parts contact sheet (DRAFT — gated on D-021)

Status: **draft, not yet production**. This is the parts-first generation
spec from `../IR2-JUNCTION-BRAINSTORM.md` (§2, §8). First use is the
T. rex re-anchor probe (brainstorm §7.1, owner call 2026-07-22); it
replaces Template C's cut-the-master extraction only if D-021 lands on
parts-first. Visual reference for the
concept — including what it gets wrong — is
`reference-parts-sheet-trex-chatgpt.png` (see brainstorm §8 for the
critique).

**Thread hygiene:** attach ONLY the approved master. Never attach a
previous parts sheet or any layout example — an image reference that
already "answers" the request dominates the text and gets copied, its
mistakes included. The layout knowledge lives in this template now. The
piece manifest and the ban on extra rows exist for the same reason: the
concept-reference sheet showed generators love inventing rows (eye
insets, shadow studies, trait add-ons) and severing legs at the knee.

```text
Using the attached approved Createosaur [SPECIES NAME] master illustration
as the exact identity, style, lighting and scale anchor, create a PARTS
CONTACT SHEET of the same individual animal — every piece drawn separately,
complete, and ready to be reassembled by overlapping at defined joint lines.

THE MOST IMPORTANT RULE, before anything else: each hind leg is ONE
COMPLETE PIECE that INCLUDES ITS ENTIRE THIGH, from inside the hip socket
down through the foot and claws. The thigh is never part of the torso or
pelvis pieces. If a hind leg piece is missing its thigh, the sheet is
wrong.

The sheet contains EXACTLY TEN PIECES plus the anchor, and nothing else:
neck, torso, pelvis, upper head, lower jaw, near arm, far arm, near hind
leg, far hind leg, tail. Do NOT add any other rows or items — no eye or
facial detail insets, no light/shadow study, no pattern overlay, no trait
add-ons, no alternate poses, no assembled preview.

One image, organized in rows on a plain light neutral background with a
faint uniform registration grid. Same left-facing side profile, same
lighting direction, and the SAME SCALE for every piece and the anchor row —
no per-piece zoom anywhere on the sheet.

ROW 1 — anchor: the approved master illustration, unchanged.

ROW 2 — body core, three pieces: neck, torso, pelvis. Each is COMPLETE and
CLOSED: no holes, no openings, no missing regions where limbs or head
attach. Paint plain believable hide across the shoulder and hip regions —
limbs will sit on top of or behind these pieces, never inside them. Where
these three pieces meet each other, give each a generous plain overlap
margin continuing into its neighbor.

ROW 3 — upper head and lower jaw as two separate labeled pieces (mouth
interior painted on the head piece, [MOUTH POSE PER ADDENDUM §1]).

ROW 4 — limbs, four separate labeled pieces, each complete and severed
ONLY at its body socket: near arm and far arm (shoulder to claw tips),
near hind leg and far hind leg (each with its full thigh, per the rule
above). Far-side pieces get the same value treatment the master uses for
its far side.

ROW 5 — tail, one complete piece severed at the tail-root socket.

SOCKET RULE, every severed piece: the piece ends at its named socket line
[SOCKET TABLE PER ARCHETYPE FRAMING CONTRACT], then continues PAST that
line with a plain smooth flesh stub at least [S] px long — no silhouette
detail on the stub; it exists to be hidden under the adjoining piece when
assembled. Severed edges are clean socket lines with stubs, never ragged
tears and never painted-in shadow gaps.

APPEARANCE: [IF D-023 / NEUTRAL-VALUE: every piece in neutral grayscale
value — full form shading, scale texture, wrinkles, eyes/claws/teeth
detail, but NO hue and NO pattern. Add one extra row: the species' signature
pattern as a separate flat overlay layer on the master's silhouette.]
[OTHERWISE: same palette and pattern treatment as the approved master on
every piece.]

Label each piece in small plain text ABOVE it, never overlapping any
artwork. Generous empty space between pieces — nothing touches or overlaps
on the sheet. No decorative typography, no scene, no extra annotations.

This is a production-art pipeline task: the pieces will be sliced from this
sheet and rigged directly, so completeness, scale consistency and clean
socket stubs matter more than composition.
```

Follow-up prompt for corrections (keep the thread's context):

```text
Regenerate only [PIECE NAME] on the same sheet conventions: same scale,
same lighting, same style, severed at [SOCKET], with its plain tuck-under
stub. Do not change any other piece.
```
