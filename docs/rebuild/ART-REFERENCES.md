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

## Drift analysis (confirmed against the references above)

Read from the reference board, most actionable first. These are proportion
notes for a **future data-tuning pass** (morph vectors live in
`packages/species-data`, authored via `/workbench`); nothing here is applied
yet — a vector change re-goldens all 105 snapshots and touches roster data the
owner owns, so it waits for a go-ahead.

- **Ankylosaurus** — clearest miss. The reference is long, low, and flat (a
  tank); ours is short-bodied and tall-backed (reads as a hump). Lengthen
  `bodyLen`/`tailLen`, drop `hipY` less relative to body, thin the dorsal
  hump. Highest visual payoff.
- **Triceratops** — head + frill too small relative to a body that reads too
  long/gracile. The reference head-with-frill is ~⅓ of body length. Grow
  `headSize`, shorten trunk, or push the frill feature intensity.
- **Spinosaurus** — sits too upright and short. Reference is long-bodied and
  low-slung with a horizontal spine; lengthen body/tail, lower the neck
  carriage. (Note: modern aquatic reconstruction — we keep the sail.)
- **Brachiosaurus** — signature is high shoulders sloping down to low hips
  (forelimbs longer than hind). Ours has the neck but a flatter back;
  increase `shoulderRise`, or lengthen `fLegLen`.
- **Stegosaurus** — plates could be larger and the head smaller/lower; the
  reference back arches higher over tiny head. Mostly a feature-scale nudge.
- **Diplodocus** — tail should dominate more (whip); nudge `tailLen` up
  relative to `bodyLen`.
- **Tyrannosaurus / Allosaurus** — slightly gracile; a touch more `bodyThick`
  and `headSize` would add the theropod heft. Minor.
- **Iguanodon** — bulkier, deeper body and stouter forelimbs (semi-quadruped).
  Minor.
- **Parasaurolophus, Velociraptor, Dracorex** — proportions read true to
  reference; no change needed.

## Workflow

1. ✅ Retrieve references via API with license metadata; record rows above.
2. ✅ Build the comparison board (`docs/rebuild/fidelity/reference-board.png`).
3. ⏳ On owner go-ahead: tune morph vectors (`packages/species-data`, via
   `/workbench`) and any skull constants where drift is clear; regenerate
   goldens in a dedicated `data:`/`goldens:` commit pair per AGENT-GUIDE.
   Exemplars (rex, trike, stego, brachio, para) change carefully — later
   species tune from them.
