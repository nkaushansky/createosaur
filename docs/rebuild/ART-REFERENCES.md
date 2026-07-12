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

Status: **pending network access** — this session's environment allowlist
blocks commons.wikimedia.org / phylopic.org / si.edu, so rows below are
placeholders until references can be retrieved and license-verified. Do not
fill a row without checking the license metadata at retrieval time.

| Species | Silhouette (CC0) | Reconstruction | Creator | License | Notes |
| --- | --- | --- | --- | --- | --- |
| Tyrannosaurus rex | _pending_ | _pending_ | | | |
| Triceratops horridus | _pending_ | _pending_ | | | |
| Stegosaurus stenops | _pending_ | _pending_ | | | |
| Brachiosaurus altithorax | _pending_ | _pending_ | | | |
| Parasaurolophus walkeri | _pending_ | _pending_ | | | |
| Ankylosaurus magniventris | _pending_ | _pending_ | | | |
| Spinosaurus aegyptiacus | _pending_ | _pending_ | | | note 2020+ reconstructions differ radically (aquatic tail); pick one era and say so |
| Velociraptor mongoliensis | _pending_ | _pending_ | | | must be feathered (matches our coat) |
| Dracorex hogwartsia | _pending_ | _pending_ | | | scarce; pachycephalosaurid refs acceptable for body, keep the Dracorex skull |
| Allosaurus fragilis | _pending_ | _pending_ | | | |
| Diplodocus carnegii | _pending_ | _pending_ | | | |
| Iguanodon bernissartensis | _pending_ | _pending_ | | | |

## Provisional drift notes (from anatomy knowledge, to confirm on references)

Observations from the M1b contact sheets, flagged for the tuning pass once
references land — provisional, not yet source-confirmed:

- **Diplodocus**: real animal is ~room-length tail — our `tailLen` reads
  short relative to `bodyLen + neckLen`; the whip should dominate.
- **Iguanodon**: forelimbs proportionally longer/stouter (semi-quadruped);
  ours read slightly gracile.
- **Spinosaurus**: skull longer and lower than the current blend renders at
  `headSize`/`snoutLen`; crocodilian read could push further.
- **Brachiosaurus**: front-heavy posture is right; withers could sit higher
  (taller shoulder than hip is its signature).
- **Ankylosaurus**: wider/lower stance would read more tank-like — limited by
  the shared side-view morphospace; acceptable stylization.

## Workflow

1. Retrieve references via API with license metadata; record rows above.
2. Rebuild the comparison sheet (`docs/rebuild/fidelity/`): our render
   beside the reference silhouette per species, matched body length.
3. Tune morph vectors in the workbench (species-data) and skull constants
   (renderer) only where drift is clear; each change re-goldens in a
   dedicated commit per AGENT-GUIDE.
