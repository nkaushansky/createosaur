# Naming Conventions

These naming conventions are suggested defaults for future packages.

## 1. Species package names

Use lowercase kebab-case.

Examples:
- `trex-r0-v1`
- `allosaurus-r0-v1`
- `parasaurolophus-r0-v1`
- `triceratops-r0-v1`

If the illustrated renderer track is being referenced inside the repo, prefer:
- `trex-ir0-v1`
- `allosaurus-ir1-v1`

Use whichever matches the implementation context, but stay consistent inside a package.

---

## 2. Recommended folder structure

```text
[species-package]/
  README.md
  manifest.json
  approved-master.png
  clean-master.png
  layers/
  pattern-masks/
  traits/        # optional
  debug/
```

---

## 3. Layer names

Use stable, readable names:

- `far-hind-shank-foot`
- `far-hind-thigh`
- `near-hind-shank-foot`
- `near-hind-thigh`
- `far-forelimb`
- `near-forelimb`
- `tail`
- `pelvis`
- `torso`
- `neck`
- `head-upper`
- `jaw-lower`

If species-specific variants are needed, keep them simple:
- `frill-front`
- `frill-back`
- `horn-near`
- `horn-far`
- `nose-horn`
- `sail`
- `crest`
- `plates`
- `tail-club`

---

## 4. Pattern masks

Per layer:
- `solid.png`
- `mottle.png`
- `bands.png`

Stored under:
```text
pattern-masks/[layer-name]/
```

Example:
```text
pattern-masks/torso/solid.png
pattern-masks/torso/mottle.png
pattern-masks/torso/bands.png
```

---

## 5. Debug artifact names

Suggested defaults:
- `layer-contact-sheet.jpg`
- `hidden-overlap-map.png`
- `pattern-mask-contact-sheet.jpg`
- `reassembled-transparent.png`
- `approved-master-preview.jpg`
- `visible-layer-ownership.png`

---

## 6. Review and documentation artifacts

Suggested names:
- `manifest.json`
- `layer-index.csv`
- `ACCEPTANCE-CHECKLIST.md`
- `PIPELINE-NOTES.md`

---

## 7. Versioning

Use:
- `v1`, `v2`, `v3`

for asset revisions.

Examples:
- `parasaurolophus-r0-v1`
- `parasaurolophus-r0-v2`

Do not silently overwrite older approved packages. Keep revisions explicit.
