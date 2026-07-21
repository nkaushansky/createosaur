# Createosaur Asset Generation Bible

This package is the working bible for future **Createosaur illustrated-rig asset generation**.

It is designed to support **two collaborators with different roles**:

- **ChatGPT image-generation workflow**
  - develop visual direction
  - generate and refine approved master illustrations
  - help produce layer-pack concepts, pattern masks, trait packs, and review artifacts
  - guard consistency of the illustrated-rig style

- **Claude Code implementation workflow**
  - integrate approved assets and specifications into the repository
  - build and test `/rig-lab` and later illustrated-rig routes/tools
  - preserve deterministic behavior, repository structure, and test hygiene
  - avoid undocumented drift from approved art direction

## Included files

- `CREATEOSAUR-ASSET-GENERATION-BIBLE.md`
- `CHATGPT-IMAGE-GENERATION-WORKFLOW.md`
- `CLAUDE-CODE-COLLABORATION-GUIDE.md`
- `PROMPT-TEMPLATES.md`
- `STYLE-RULES-AND-LAYER-CONTRACT.md`
- `ACCEPTANCE-CHECKLISTS.md`
- `NAMING-CONVENTIONS.md`

## Purpose

This bible exists because the project now depends on a **repeatable art-to-rig pipeline**, not one-off pretty dinosaur pictures.

The approved direction is:

- authored editorial paleontology illustration
- deterministic 2D rigging
- local per-part pattern masks
- controlled hidden overlap
- future species should match the approved T. rex family

## Current status

The T. rex pipeline has already established:

1. approved editorial-style master illustration
2. controlled exact-source layer extraction
3. hidden overlap pack
4. per-layer pattern masks
5. standalone browser deformation prototype
6. Claude Code implementation handoff for IR0 `/rig-lab`

Future species should be produced using the same staged workflow.

## Important warning

Do **not** try to generate the final species master, layer pack, masks, and technical sheet in one giant prompt.

That approach creates:
- fake labels
- style drift
- anatomy drift
- inconsistent repeated parts
- unusable rig outputs

Use the staged workflow defined in the other files.
