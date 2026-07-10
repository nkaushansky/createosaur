# Createosaur v3 — Game Design

The mechanical heart of the product. The interactive prototype
("Morph Lab", built 2026-07) validated the core mechanics below with
3 species; this document generalizes them to the full roster.

## 1. Core loop

```
 add species to gene pool → slide DNA weights → creature morphs live
        ↑                                              ↓
 remix someone's creature ← share card ← name & save ← pin parts (Lego layer)
```

Secondary loops: breed two saved creatures (M4) · collect the dex (M4) ·
AI portrait finish (M5).

## 2. The genome (schema v1)

The genome is the product. Everything renders from it deterministically.

```ts
interface Genome {
  v: 1;
  dna: Array<{ species: SpeciesId; share: number }>; // the GENE POOL: 1–4 entries, shares sum to 100
  parts: Partial<Record<PartSlot, SpeciesId>>;       // Lego layer: pin = that species owns the slot outright
  cosmetics: {
    hide: HexColor;            // primary skin
    markings: HexColor;        // secondary (pattern, plates, frill interior)
    pattern: 'solid' | 'stripes' | 'spots' | 'rings' | 'countershade';
  };
  size: number;                // 0–100, display scale + stat input
  age: 'hatchling' | 'juvenile' | 'adult';
  seed: number;                // micro-variation; part of identity, not randomness at render time
}

type PartSlot = 'head' | 'back' | 'tail' | 'stance' | 'skin';
```

Rules that keep the mental model clean:

- **The gene pool is the roster; sliders are influence; pins are ownership.**
  A pinned slot uses that species 100%, regardless of its slider value. A
  species can be pinned even at 0% DNA — it's in the pool, so its parts are
  in the bin.
- Pool is capped at **4 species** (naming, UI, and blend legibility all
  degrade past 4; the cap is a design feature).
- Removing a species from the pool clears its pins (with an undo toast).
- `seed` is set at creation and never re-rolled silently. Two creatures with
  identical dna/parts but different seeds are **siblings, not clones** —
  this matters for breeding.
- Schema is versioned. Renderers must render every historical version
  forever; migrations happen on write, never on read.

## 3. Morphing mechanics — how it actually works

### 3.1 Shared morphospace

Every species is a point in one shared parameter space (**morphospace**): a
vector of ~40 anatomical parameters with uniform meaning across all species.

Parameter groups (validated in the prototype, extend as needed):

| Group | Parameters (indicative) | Owned by slot |
|---|---|---|
| stance | hipHeight, shoulderRise, frontLegLen/Thick, hindLegThick, digitCount | `stance` |
| torso | bodyLen, backArch, bodyThick, chestThick | `back` |
| neck+head | neckLen, neckRise, neckThick, headSize, snoutLen, snoutTaper, jawDepth | `head` |
| tail | tailLen, tailDrop, tailThick | `tail` |
| integument | scaleStyle, featherCoverage (0–1), textureDensity | `skin` |

**Blending is a weighted average in this space.** For each slot group, the
effective weights are either the normalized DNA shares (unpinned) or one-hot
(pinned). Because every parameter is anatomically meaningful and every
species' vector is hand-tuned to be valid, **any convex mix is a valid
animal** — that's what makes biped↔quadruped morphs work (front legs
literally grow from T-Rex arms to Triceratops columns as the weights shift).

### 3.2 Feature genes (the discrete stuff)

Horns, frills, plates, spikes, sails, crests, feathers don't average well —
half a frill looks like a mistake. They are **feature genes** with:

- `type` (variant): e.g. headgear = `horns3 | horns1 | crest | domeSkull | frillSmall | none`
- `intensity` 0–1

Expression rule (**the threshold ramp** — prototype-validated):

```
intensity = smoothstep(0.18, 0.55, effectiveWeightOfCarrierSpecies)
```

So a feature *pops in* as its carrier crosses ~20% and reaches full size by
~55%. This is the moment that makes sliding feel biological rather than
photoshoppy — protect it. When two pool species carry the same feature slot
(e.g. Triceratops frill + Styracosaurus frill), the **dominant carrier's
variant** renders at their **combined** intensity.

### 3.3 Body-plan archetypes (how 40+ species fit one morphospace)

Terrestrial dinosaurs fit one topology (validated: theropod ↔ ceratopsian ↔
stegosaur morphs all read correctly). The v1 roster is **terrestrial-only**
(~35–38 of the 43 legacy species). Each species declares an archetype used
for parameter-range sanity checks and future expansion routing:

- `theropod` (bipedal), `ceratopsian`, `armored` (stego/anky), `sauropod`
  (stress-tests neck/tail ranges — include, it's a crowd-pleaser),
  `ornithopod` (duck-bills; bipedal-leaning quadruped).
- **Excluded from v1**: `marine` (Mosasaurus — flippers break the limb
  topology) and `flyer` (wings ditto). These return as themed expansions
  with their own environment (waterline! sky!) — strong future beats, not
  v1 scope creep.

### 3.4 Age & size

- `age` applies a fixed parameter transform, not new data: hatchling =
  bigger head ratio, shorter snout, stubbier limbs, bigger eye (cuteness is
  a transform!). Juvenile interpolates halfway.
- `size` scales display and feeds stats. Real species length/weight data
  (already in the database) sets each species' *natural* size; the slider
  expresses deviation from the blend's natural size.

### 3.5 Micro-variation

`seed` drives bounded jitter: ±3% on morph parameters, spot/stripe placement,
plate count ±1. Enough that siblings differ; never enough to break identity.

## 4. The parts picker — adaptive by design

**The picker's contents are derived from the gene pool.** This is the core
answer to "how does the parts picker change based on input dinosaurs":

1. **The bin shows only your pool.** With T-Rex + Triceratops + Ankylosaurus
   loaded, the `head` slot offers exactly: Blend (auto) · T-Rex ·
   Triceratops · Ankylosaurus. No 43-species dropdown paralysis; adding a
   species to the pool *is* how you add parts to the bin (Lego Jurassic
   World's model, generalized).
2. **Options are pictures, not words.** Each option renders as a live
   thumbnail of *that species' version of that part* using the same renderer
   in vignette mode (head-only crop, tail-only crop...). The renderer being a
   pure function makes this nearly free.
3. **Slot chips on the creature.** Tapping the creature's head region opens
   the head slot picker (direct manipulation); the dropdown panel is the
   accessible/discoverable equivalent. Both set the same pin.
4. **Blend is always first** and shows the current blended part, so "auto"
   is a visible choice, not an absence.
5. **Pins survive slider changes** (ownership > influence), and clear with
   an undo toast when their species leaves the pool.
6. **(M4+ hook — "loose parts")**: parts from species *not* in your pool,
   earned via collection/breeding milestones, appear in a separate bin
   section. This turns the picker into a progression system without
   touching its v1 mechanics. Rarity lives here (atavism mutations, see §6).

## 5. Names, stats, placard (C-seasoning)

- **Naming**: each species defines syllables `{prefix, mid, suffix}`
  ("Tyranno/rexo/rex", "Tricera/cerato/tops"). Compose by identity order:
  2-species → prefix+suffix ("Stegorex"); 3-way → prefix+mid+suffix
  ("Tyrannoceratosaurus"); ≥88% pure → real species name. **Identity weights
  include pins** (a pinned Trike head makes it a Tyrannoceratosaurus even at
  100% T-Rex DNA — validated in prototype, feels right).
- Users can rename; generated name remains as the "scientific" subtitle.
- **Stats** (attack/defense/speed/brains + fun ones like `nap quality`):
  linear in identity weights from per-species stat rows, modulated by size
  and age. Displayed as meters. Not a balanced combat system — a
  conversation piece (until/unless a battle mode is ever prioritized: see
  DECISIONS D-011).
- **Placard chips**: period (real; mixed eras → "Epoch: impossible"), diet
  (mixed → "Omnivore (allegedly)"), habitat, real length/weight of the blend
  (weighted average, shown next to a school-bus silhouette for scale).
- **Fact drawer**: real facts for each pool species, straight from the
  database, visually separated (field-notebook style) from the playful
  fiction. This is the honest-science pillar made visible.

## 6. Breeding & collection (B-layer, M4)

Operates purely on genomes — no new rendering tech required.

- **Cross**: child pool = union of parents' pools (trimmed to 4 by top
  share); child shares = midpoint ± seeded noise; each part slot inherits
  parent A's pin / parent B's pin / blend at 45/45/10.
- **Mutation (10% per slot)**: usually re-rolls within the union pool;
  rarely (~1 in 40 breeds) an **atavism** — a part from a species in
  *neither* parent. This is the rarity engine and the only way to get some
  parts early. Atavism odds/tables are data, not code.
- **Lineage**: child stores parent genome IDs; every creature page shows its
  family tree; "bred from" chains are shareable. Lineage is the social
  growth loop's backbone.
- **Eggs**: breeding yields an egg that hatches on next visit (return-visit
  mechanic). Instant-hatch during M4 development; timed hatch is a flag.
- **The Saurdex**: a collection index of species used, parts discovered,
  name combos found. Completion percentages for the completionists.

## 7. Sharing & remixing (M2 — the growth loop)

- Every saved creature: `createosaur.com/c/:id` — server-rendered page whose
  OG image *is* the creature render (SVG→PNG at the edge).
- **Remix** loads the genome into your lab, incrementing the original's
  remix counter and crediting it on your creature's page ("remixed from …").
- Anonymous users can share (creature stored server-side with no account;
  claimable later) — sharing must never sit behind auth.

## 8. AI portraits (M5 — the finish, never the loop)

- Input: genome + the deterministic SVG render as an image-to-image control.
  Output: a painterly portrait that *matches the creature* (same silhouette,
  parts, palette) — solving v2's consistency failure structurally.
- Provider-abstract service behind one interface; seeded from genome hash so
  re-runs are stable. Server-side keys only, hard budget caps, credits from
  day one of the feature (no free-tier bleed — v2's lesson).

## 9. Edge cases & rules of thumb

- Empty pool → can't happen; pool minimum is 1, default load is a starter mix.
- All sliders 0 → treat as equal shares (never a null creature).
- Sliders don't auto-normalize while dragging (twitchy); shares normalize on
  release. Display always shows normalized %.
- Deleting the last creature in the dex: fine, the lab always works.
- Name filter: generated names are safe by construction; user renames pass a
  profanity filter before appearing on public pages.
