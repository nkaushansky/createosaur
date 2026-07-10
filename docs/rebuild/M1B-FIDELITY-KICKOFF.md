# M1b Kickoff Prompt — the fidelity pass (pre-launch)

Paste into a fresh Claude Code session. This is the last gate before the
owner's DNS cutover (D-018): the creatures go from prototype-grade to
launch-grade. Model note: this is visual-judgment work — use a strong model
and expect many screenshot-iterate rounds.

---

Read `CLAUDE.md`, `docs/rebuild/AGENT-GUIDE.md` (verify loop + review
ritual), and the M1 "Shipped / Planned next" section of
`docs/rebuild/ROADMAP.md`, which contains the owner's art direction. It is
binding: **"Camp Cretaceous cartoony-realistic-esque, or at least a more
detailed field-guide drawing — not photoreal."**

Your task is the **renderer fidelity pass** in `packages/renderer` only —
no genome/schema/UI changes:

1. Interior linework: contour/muscle lines that follow the spine geometry
   (you have tangents/normals at every sample — use them).
2. Volume: two-tone or gradient shading (SVG gradients are fine — they
   serialize deterministically if you emit stops with fixed precision).
3. Feature upgrades: organic sail (curved membrane + spine rays), feathers
   as a layered coat, textured club knob, better eye/brow, varied outline
   weights.
4. Texture suggestion by integument: scale stippling / plate seams at low
   density (this is 2D field-guide, not noise).

Hard rules:
- Determinism invariant unchanged: same genome → identical SVG. All
  variation seeded from `genome.seed`. Purity tripwire must stay green.
- This pass regenerates ALL goldens: do it as one dedicated commit whose PR
  includes before/after contact sheets of every pure species and the
  archetype-mix fixtures. The owner approves the look on the PR before
  merge — expect iteration.
- Render budget: keep the live-morph experience smooth on a school
  Chromebook. If detail costs frame time, gate it behind a renderer option
  the picker vignettes can turn off.

Verify per AGENT-GUIDE: contact sheets of all 12 pure species + the 10
exemplar mixes + hatchlings, both themes, before/after side by side.
