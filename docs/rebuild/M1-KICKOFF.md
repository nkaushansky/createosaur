# M1 Kickoff Prompt

Paste the prompt below verbatim into a fresh Claude Code session to start
Milestone M1. Written model-agnostic: it works for Opus or Fable. Branch
from `main` (M0 is merged; all gates green there).

---

Read `CLAUDE.md`, then `docs/rebuild/GAME-DESIGN.md` (§3 morphing, §4 parts
picker), `docs/rebuild/ARCHITECTURE.md` (species data pipeline), and the M1
section of `docs/rebuild/ROADMAP.md` before writing code.
`docs/rebuild/DECISIONS.md` is settled law. Follow
`docs/rebuild/AGENT-GUIDE.md` — especially the screenshot-verify loop; M1 is
visual work and screenshots are the deliverable evidence.

Your task is **Milestone M1: The roster**, in this order:

1. **Species workbench** (dev-only route `/workbench`, excluded from the
   production nav): every `MorphVector` parameter on a slider, feature-gene
   toggles, live render, and a "copy species JSON" export shaped exactly
   like a `packages/species-data` entry. This is the authoring tool the
   whole milestone runs through — build it first and build it kindly.
2. **Renderer part vignettes**: add `renderPart(speciesId, slot)` (or an
   equivalent crop option on `renderCreature`) producing a small deterministic
   SVG of one species' version of one slot, for picker thumbnails. Same
   purity/determinism invariants; extend the golden fixtures to cover it.
3. **Archetype exemplars** (extra care, one at a time, screenshot each):
   - `sauropod` — Brachiosaurus (stress-tests neck/tail/size ranges)
   - `ornithopod` — Parasaurolophus (crest feature; biped-leaning stance)
   - new feature kinds as needed: `sail` (Spinosaurus), `crest`,
     `domeSkull` (Pachycephalosaurus), `tailClub` (Ankylosaurus),
     `feathers` (raptors). Feature variants render from the carrier species
     per GAME-DESIGN §3.2.
4. **Wave 1 roster** (6 new species beyond the M0 three): Brachiosaurus,
   Parasaurolophus, Ankylosaurus, Spinosaurus, Velociraptor,
   Pachycephalosaurus. **Facts come only from
   `legacy/src/data/dinosaurDatabase.ts` — never invent paleontology.**
   Each species gets an integrity-test pass and a golden fixture.
5. **Species browser**: searchable, filter by era/diet/size, feeding the
   gene pool (add/remove/swap; pool cap 4 per D-007). Removing a pooled
   species clears its pins with an undo toast (GAME-DESIGN §4).
6. **Parts picker v1 upgrade**: options rendered as part vignettes (not
   words), Blend always first showing the current blended part, pins
   surviving slider changes.
7. Every pairwise mix of archetype exemplars renders without anatomical
   breakage — add golden fixtures for the wildest ones (sauropod×theropod,
   ankylosaur×ornithopod) and screenshot them for the PR.

Constraints and cautions:
- Genome schema changes need owner approval (CLAUDE.md). Adding
  `FeatureKind` values and widening morph ranges is expected M1 work and
  does NOT need approval; changing `Genome`'s shape does.
- Golden snapshots regenerate only in dedicated commits with before/after
  screenshots and a stated reason.
- If sauropod extremes break the shared width-profile assumptions, tune the
  renderer's keypoint construction rather than capping the species — and
  regenerate goldens per the rule above.
- No analytics in M1 (D-017). Static export must keep working (D-016) —
  `npm run build && npm run e2e` is the gate, and the deliverable artifact
  is `apps/web/out/`.
- Definition of done: the M1 section of ROADMAP.md. Visual latitude per
  that section; the mechanics above are not latitude.

Work in waves and commit per wave — a reviewable, shippable roster increment
each time, not one giant drop.

---

## Notes for the owner

- Run step 1–3 in one session if possible; waves 4–7 split naturally.
- End of M1 = your DNS cutover moment (D-018): upload `apps/web/out/` to
  DreamHost, point createosaur.com at it, and v3 is live.
