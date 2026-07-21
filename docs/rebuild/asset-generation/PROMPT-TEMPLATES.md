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
