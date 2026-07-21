# Createosaur Asset Generation Bible

## 1. Mission

Create a repeatable pipeline for generating future Createosaur illustrated-rig assets that are:

- visually consistent with the approved T. rex
- anatomically grounded
- rig-friendly
- suitable for deterministic interactive rendering
- understandable by both ChatGPT and Claude Code
- inspectable and reviewable before repository integration

This bible defines the **art direction**, **workflow**, **artifact contract**, and **collaboration boundary** between image-generation work and implementation work.

---

## 2. Approved visual direction

The approved direction is **editorial paleontology illustration**.

It is:

- semi-realistic
- more realistic than cartoon
- not photoreal
- not cinematic CGI
- not childish
- not toy-like
- not mascot-like
- not “derpy”

It should feel like:

- a refined natural-history editorial illustration
- a modern field-guide-style reconstruction
- a believable animal portrait simplified just enough to rig

### The “half-second test”

The creature should read as a **real animal** almost immediately.

If the first impression is:
- “real dinosaur / believable animal” → acceptable direction
- “cartoon dinosaur / children’s drawing / goofy mascot” → wrong direction

---

## 3. Core style rules

### 3.1 Silhouette
- clear and readable
- species-appropriate
- full body visible
- strong profile presentation
- feet and tail tip visible
- pose stable and readable

### 3.2 Head and face
- no derpy look
- no oversized eye
- eye small, dark, and seated under brow
- mouth closed or nearly closed in neutral state
- no broad smile
- no “Muppet jaw”
- species identity should be recognizable through skull silhouette and proportions

### 3.3 Surface treatment
- subtle texture
- believable folds and wrinkles
- value-based volume
- restrained palette
- enough detail to feel alive
- not so much noise that later rigging becomes impossible

### 3.4 Presentation
- plain neutral background
- no scenery unless explicitly requested
- no labels unless explicitly requested
- no fake text
- no poster layout
- no infographic junk
- no checkerboard transparency backgrounds in final approvals

---

## 4. Canonical workflow

Future species should follow this sequence.

### Stage 1 — Approved master illustration
Goal:
- create one clean, fully assembled, full-body profile illustration

Deliverable:
- approved master species image

### Stage 2 — Controlled layer extraction
Goal:
- preserve exact visible appearance of the approved master
- separate it into riggable anatomical layers

Deliverable:
- layer pack with full-canvas aligned parts

### Stage 3 — Hidden overlap
Goal:
- manually extend concealed artwork beneath adjoining pieces so motion does not expose holes

Deliverable:
- overlap-safe version of each layer

### Stage 4 — Pattern masks
Goal:
- generate per-layer masks for solid, mottle, and bands

Deliverable:
- local grayscale masks per layer

### Stage 5 — Trait pack (optional)
Goal:
- generate hybrid attachment pieces such as frills, horns, sails, plates, crests, feathers, clubs, spikes

Deliverable:
- isolated trait pieces plus optional assembled preview

### Stage 6 — Review pack
Goal:
- make review easy for both design and implementation

Deliverable:
- contact sheets
- overlap maps
- pattern previews
- manifest / naming references
- acceptance checklist

---

## 5. Non-goals for ChatGPT image generation

ChatGPT image-generation should **not** be trusted to do all of these at once:

- final implementation math
- exact repo integration
- final mesh topology decisions
- fake diagram labeling
- giant technical poster sheets with lots of tiny text
- automated exact production cutting if the source art drifts

ChatGPT’s job is to create and refine **visual source material and review artifacts**, not to silently replace implementation rigor.

---

## 6. Roles and responsibilities

### ChatGPT is best at:
- art direction
- reference-based visual iteration
- style continuity
- producing clean species masters
- producing trait concepts
- producing guided extraction/reference artifacts
- identifying when a visual result is “off”
- prompt discipline
- establishing future asset-generation rules

### Claude Code is best at:
- implementing approved directions in the repository
- wiring assets into `/rig-lab`
- creating the deterministic pose system
- building mesh deformation
- validating asset loading
- maintaining tests, build health, and branch hygiene

### Shared responsibility:
- protect consistency with the approved T. rex family
- keep the production renderer stable until the illustrated-rig path is approved
- avoid silent drift from agreed direction

---

## 7. Canonical artifact stack for a new species

Each new species should ideally end with the following package:

1. approved master illustration
2. transparent clean master
3. layer pack
4. hidden overlap pack
5. per-layer pattern masks
6. optional trait pack
7. assembled reference image
8. contact sheet
9. overlap debug map
10. pattern preview sheet
11. manifest / index / naming sheet
12. review checklist

---

## 8. Species rollout strategy

Do not jump randomly across all species.

Preferred sequence:

- **IR0:** T. rex only
- **IR1:** theropod family
  - T. rex
  - Allosaurus
  - Velociraptor
  - Spinosaurus
- **IR2:** one rig per major archetype
  - theropod
  - sauropod
  - ceratopsian
  - armored
  - ornithopod

This lets the visual and technical pipeline mature without solving every dinosaur at once.

---

## 9. Critical warnings

### Warning 1: do not ask for everything in one pass
A single request like:
> “Generate a clean species rig with parts, labels, masks, debug, and overlays”

usually degrades quality.

### Warning 2: do not redesign during extraction
Once a master is approved, the layer stage should preserve the exact visible design.

### Warning 3: do not rely on fake text
Tiny AI-generated labels are often wrong or unreadable and make the artifact look worse.

### Warning 4: do not let implementation invent a second art direction
Claude Code should integrate the approved artifacts, not reinterpret them.

---

## 10. Success criteria

The pipeline is succeeding when:

- future species feel like they belong to the same visual family as the T. rex
- heads read as credible animals
- layer decompositions reassemble faithfully
- modest deformation does not expose seams
- patterns stay attached to parts
- assets are documented clearly enough for repository implementation

If those conditions hold, Createosaur can scale this system species by species without losing its identity.
