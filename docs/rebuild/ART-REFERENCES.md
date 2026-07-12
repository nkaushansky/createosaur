# Art references — anatomy sources for the v3 roster

Why this file exists: creature *shape* should be as honestly sourced as
creature *facts*. The species database is the single source of paleontology
truth for placard content (CLAUDE.md); this file is the single source of
anatomical reference for how we draw. Nothing here overrides the docs' art
direction — references inform proportions, our renderer owns the style.

## License policy (decided with the owner, 2026-07-12)

- **Embed or trace closely**: CC0 / public-domain sources only.
- **Link as reference**: CC-BY is fine with the credit recorded here.
- **Avoid for derivation**: CC-BY-SA (share-alike obligations in a product),
  all-rights-reserved art, and any franchise character designs (style
  inspiration only — never a specific trademarked character).
- **AI image generators are not a source**: outputs can echo trademarked
  designs; usable for brainstorming only, never as a tracing base.
- Every reference used gets a row here: file, creator, license, retrieval
  link. No row, no use.

## Preferred sources

1. **PhyloPic** (phylopic.org) — accurate side-view silhouettes, many CC0;
   matches our renderer's projection almost exactly. Check each image's
   license — the collection mixes CC0 with CC-BY variants.
2. **Wikimedia Commons** — modern reconstructions; filter by license via the
   API's `extmetadata` (LicenseShortName), prefer CC0/PD, record artist.
3. **Smithsonian Open Access** (si.edu) — CC0 fossil photography and
   skeletals.
4. **US government publications** (NPS/USGS) — public domain by statute.
5. **Classic paleoart** (Hawkins, Harder, pre-1930 Knight) — public domain by
   age; charming but anatomically outdated (poses, posture, integument). Use
   for mood only, not proportions.

## Per-species reference table

All references retrieved from Wikimedia Commons 2026-07-12 with license
verified from the file's `extmetadata` at fetch time. Composite board:
`docs/rebuild/fidelity/reference-board.png` (our render | silhouette |
reconstruction, per species; credits burned into the captions). Silhouettes
are mirrored to face left on the board to match our renders; originals face
right unless noted.

| Species | Silhouette · license | Reconstruction · creator · license | Notes |
| --- | --- | --- | --- |
| Tyrannosaurus rex | Tyrannosaurus silhouette.svg · **CC0** | *T. rex and Triceratops* · Charles R. Knight · **PD** | Knight 1900s mural — historic tail-drag pose, mood only |
| Triceratops horridus | Triceratops Scale V1.svg · **PD** | Osborn & Lang mounted skeleton 1933 · **PD** | silhouette is two ceratopsians + human scale bar; use the profile only |
| Stegosaurus stenops | Stegosaurus silhouette.svg · **CC0** | Smithsonian *S. stenops* model · C. W. Gilmore · **PD** | |
| Brachiosaurus altithorax | Brachiosaurus silhouette.svg · **PD** | Dmitry Bogdanov · **PD** | |
| Parasaurolophus walkeri | Parasaurolophus silhouette.jpg · **PD** | Walters, Senter & Robins · **CC BY 2.5** | attribution required if reused |
| Ankylosaurus magniventris | Ankylosaurus silhouette.svg · **CC0** | LadyofHats (M. R. Villarreal) · **PD** | |
| Spinosaurus aegyptiacus | Spinosil.svg · **CC0** | Brondon Bobah · **CC BY 4.0** | modern (2020+) aquatic-tail reconstruction; attribution required |
| Velociraptor mongoliensis | Velociraptor size.png · **CC0** | *V. mongoliensis* ink study · **PD** | silhouette is a size chart of 4 specimens; feathered recon is the better proportion ref |
| Dracorex hogwartsia | Pachycephalosaurus silhouette.jpg · **PD** | Nobu Tamura · **CC BY 3.0** | silhouette is a pachycephalosaurid **body proxy** — Dracorex ones are scarce; keep the Dracorex skull, borrow body proportions only. Attribution required for the recon |
| Allosaurus fragilis | Allosaurus silhouette 01.jpg · **PD** | Karkemish · **CC BY 3.0** | attribution required |
| Diplodocus carnegii | Diplosil.svg · **CC0** | Alice B. Woodward 1912 · **PD** | historic swamp pose — outdated posture, mood only |
| Iguanodon bernissartensis | Iguanodon Silhouette.svg · **PD** | *PSM* 1883 skeletal · **PD** | historic tripod pose |

Attribution obligations (CC-BY reconstructions — Parasaurolophus, Spinosaurus,
Dracorex, Allosaurus): the credits above satisfy CC-BY for the reference board
as published in this repo. If any of these is ever traced into shipped art,
the credit must travel with the derivative.

## Drift analysis + tuning applied (2026-07-12)

Read from the reference board, most actionable first. All flagged species were
tuned in `packages/species-data` (owner go-ahead 2026-07-12); the board at
`docs/rebuild/fidelity/reference-board.png` shows the **post-tuning** renders.
Morph vectors are data, not schema — no genome change — and all values stay
inside the `/workbench` `MORPH_RANGES` bounds.

- **Ankylosaurus** ✅ — was short-bodied and tall-backed (a hump); now a long
  low tank. `bodyLen` 150→180, `tailLen` 200→235, `bodyThick` 128→116,
  `hipY` 350→356, `fLegLen` 100→90. Biggest visible gain.
- **Triceratops** ✅ — head/frill too small on a too-long trunk. `headSize`
  44→52, `snoutLen` 48→54, `bodyLen` 140→132, `neckLen` 50→46, `tailLen`
  190→170, `bodyThick` 100→108.
- **Spinosaurus** ✅ — was too upright/short. `bodyLen` 152→164, `tailLen`
  280→296, `neckUp` 38→26, `shoulderRise` 12→8, `hipY` 292→302 (lower, more
  horizontal). Sail kept.
- **Brachiosaurus** ✅ — flat back → high shoulders sloping to low hips.
  `shoulderRise` 72→88, `fLegLen` 224→230, `archUp` 8→4, `chestThick`
  104→110.
- **Stegosaurus** ✅ — smaller/lower head, higher arch. `headSize` 26→24,
  `archUp` 42→46, `neckUp` −18→−22.
- **Diplodocus** ✅ — bigger whip. `tailLen` 300→330, `bodyLen` 172→164.
- **Tyrannosaurus / Allosaurus** ✅ — added theropod heft. Rex `headSize`
  52→56, `bodyThick` 96→102, `chestThick` 72→76; Allo `bodyThick` 88→94,
  `chestThick` 66→70.
- **Iguanodon** ✅ — bulkier, stouter forelimbs. `bodyThick` 108→116,
  `chestThick` 86→92, `fLegThick` 22→26 (kept the long semi-quadruped
  forelimbs).
- **Parasaurolophus, Velociraptor, Dracorex** — read true to reference; left
  unchanged.

Verification: every pairwise archetype mix and the size/age extremes still
render without breakage (goldens cover these); brachiosaurus-size-max stays in
frame, the diplodocus whip tail stays in frame. Gates green.

## Workflow

1. ✅ Retrieve references via API with license metadata; record rows above.
2. ✅ Build the comparison board (`docs/rebuild/fidelity/reference-board.png`).
3. ✅ Tune morph vectors where drift was clear; goldens regenerated in a
   dedicated `goldens:` commit. Exemplars changed conservatively so later
   species still tune from them.
