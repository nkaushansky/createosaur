# Style Rules and Layer Contract

## 1. Style rules

### Approved style family
All future species should feel like they belong next to the approved T. rex.

Required style signals:
- editorial paleontology illustration
- controlled realism
- no cartoony face
- clean profile presentation
- subtle texturing
- readable silhouette
- stable neutral posture

### Disallowed drift
Avoid:
- mascot faces
- oversized eyes
- cheerful grins
- toy-like simplification
- overly glossy CGI rendering
- painterly chaos
- overly skeletal exaggeration
- fake typography sheets

---

## 2. Default layer contract

Unless a species clearly requires a variation, use this default layer breakdown:

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

This is the canonical Createosaur illustrated-rig baseline.

---

## 3. Hidden overlap rules

Every future species should include concealed extension beneath adjoining parts.

### Required overlap zones
- head under jaw/neck
- neck under head/torso
- torso under neck/pelvis/forelimbs
- pelvis under torso/tail/thighs
- tail under pelvis
- thighs under torso/pelvis
- lower legs under thighs

### Why this matters
Without hidden overlap:
- seams open during motion
- neutral reassembly may look fine, but animation fails
- implementation becomes a seam-patching exercise instead of a clean rig

---

## 4. Pattern mask contract

Every future species should support:

- `solid`
- `mottle`
- `bands`

### Requirements
- local per-layer masks
- grayscale
- aligned at neutral pose
- designed to move with the part
- not one giant body-wide screen-space overlay

---

## 5. Species-specific adjustments

The default layer contract may need adjustment by archetype.

### Theropods
Usually close to the T. rex contract.

### Sauropods
May require:
- longer/more segmented neck strategy
- longer tail segmentation
- possibly forelimb/hindlimb differences in breakdown

### Ceratopsians
May require:
- frill-specific trait or base-head strategy
- horn layers
- stronger skull silhouette

### Armored dinosaurs
May require:
- dorsal plates or armor overlays
- tail-club strategy
- armor attachment pieces

### Ornithopods
May require:
- crest overlays for species such as Parasaurolophus
- beak/face adjustments
- more conservative forelimb interpretation depending on stance

Rule:
Adjust only when necessary; keep the pipeline as standardized as possible.

---

## 6. Neutral pose contract

The neutral approval pose should be:
- stable
- weight-bearing
- clean silhouette
- mouth closed or nearly closed
- limbs readable
- tail readable
- no dynamic action posing

This pose becomes the source of truth for later extraction and reassembly.

---

## 7. Reassembly principle

The reassembled visible creature should match the approved master **exactly or as closely as possible**.

Extraction is not a redesign stage.

That principle should be repeated in every future layer-extraction request.
