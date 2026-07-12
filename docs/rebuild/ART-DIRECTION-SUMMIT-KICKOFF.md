# Art-Direction Summit Kickoff — discussion first, then the new golden path

Paste into a fresh Claude Code session. This is a **planning session, not a
build session**: it exists because three shipped restyling passes (PR #6)
made the creatures much better and still didn't clear the owner's bar at
close zoom. The goal is a decided, written art direction — a style bible and
a chosen production path — before any more roster-wide drawing work.

Model note: this is judgment-heavy design work with the owner in the loop.
Use a strong model, expect a long conversation, and expect to render small
visual probes to make abstract choices concrete.

---

Read `CLAUDE.md`, `docs/rebuild/AGENT-GUIDE.md`, `docs/rebuild/VISION.md`,
the M1 section of `docs/rebuild/ROADMAP.md` (including the M1b shipped
notes), and `docs/rebuild/ART-REFERENCES.md`. Then *look at* (verify loop —
never reason about art you haven't rendered or opened):

- `docs/rebuild/fidelity/creatures-before-after-*.png` — original → shipped
- `docs/rebuild/fidelity/reference-board.png` — ours vs license-verified refs
- `docs/rebuild/fidelity/spike-authored-heads.png` — authored-parts spike
- Merged PR #6 and its comment thread — the full history of what was tried

## Where M1b left us (findings you should treat as established)

1. **Three passes shipped** on the deterministic renderer: fidelity
   (linework, gradient volume, organic sail/coat/club, integument texture),
   anatomy (parametric skulls with jaws and socketed eyes; articulated limbs
   that merge into the body; toed feet), and reference-tuned proportions
   (all species matched to CC0/PD anatomy references — see ART-REFERENCES).
   Every pass held the invariants: determinism, purity, smooth blending,
   Chromebook render budget.
2. **The owner's verdict at close zoom: still derpy.** Confirmed on the
   max-size brachiosaurus: (a) faces read goofy on small-headed species —
   the skull construction's features collapse below ~2px when headSize is
   tiny; (b) feet are visibly separate pieces — toes/hooves are appended
   shapes, not unioned into the leg silhouette, and far feet can hover;
   (c) quadruped legs wave like hoses — the jointed S-profile was tuned on
   theropods, but sauropod legs are columns; (d) legs read tacked-on — leg
   and body gradients run in mismatched directions at the junction, and only
   near legs get the merge treatment, so far legs pop out of the belly line.
3. **The pattern across passes: diminishing returns.** Each procedural round
   fixed the previous complaint and exposed the next one at higher zoom.
   Conclusion from M1b: the *architecture* is fine — the genome→SVG engine
   absorbed three full restylings without breaking — but "iterate parametric
   curves against screenshots" is nearing its draftsmanship ceiling.
4. **The authored-parts spike de-risked the alternative.** Topology-matched,
   hand-authored vector parts blend deterministically by control-point lerp
   (teeth shrink, gape narrows, nothing tears). Its ceiling is exactly the
   quality of the authoring artist — the spike's quick hand-authored heads
   did *not* beat the tuned procedural ones. The real cost is content:
   art per species × per part, forever, against a 20+ species roster plan.
5. **The reference/licensing framework exists** (ART-REFERENCES.md): CC0/PD
   for anything embedded or closely traced, CC-BY link-only with recorded
   credit, no share-alike derivation, no franchise character designs (Camp
   Cretaceous is a *style* target, never a tracing base), no AI output as a
   tracing base (concept/brainstorm only).

## Your job in this session

**Phase 1 — discussion (start here, stay here until the owner says go).**
Enter plan mode. No repo changes, no PRs, no roster-wide rendering work.
Interview the owner to pin down what "good" means, one question at a time,
concretely enough to become rules. At minimum:

- **The acceptance test.** At what zoom must a creature look great — picker
  vignette, default lab view, max-size full viewport (820×540), all three?
  Which two or three creatures from the reference board are "done" in the
  owner's eyes, if any?
- **Derpy, operationally.** For faces: is it eye size, eye placement, mouth
  shape, head-to-body ratio? Have the owner point at renders and react;
  turn reactions into measurable ratios.
- **Appetite for content cost.** Would the owner commission an illustrator
  or hand-author parts themselves in the workbench? How does that trade
  against the 20+ species roadmap and against launch timing (D-018 cutover
  is gated on creature quality)?
- **Failure tolerance.** Hybrids are the product. Is it acceptable for
  authored hero species to blend into slightly-less-authored-looking
  hybrids, or must mixes look as good as pures?

Small throwaway probes are encouraged *inside the discussion* — a single
creature mocked up in the scratchpad to test a rule ("eyes 1.6× bigger with
a lid line — like this?") — but nothing lands in the repo during Phase 1.

**Phase 2 — write the style bible.** When the owner's answers converge,
draft `docs/rebuild/STYLE-BIBLE.md`: the measurable spec every future pass
and any commissioned art is judged against. It should cover at least: face
construction rules as numbers (eye diameter vs head height, eye-to-snout
spacing, brow/lid treatment, per-archetype skull silhouettes, small-head
handling), limb rules (posture per archetype — theropod Z vs sauropod
column vs quadruped pillar; how limbs join the torso; unified leg+foot
silhouettes; foot/ground contact), line-weight and shading system, the
zoom-level acceptance test, and what stays procedural vs what may be
authored. Owner redlines it; iterate until accepted.

**Phase 3 — decide the golden path and record it.** Candidate paths to
weigh openly (inputs, not conclusions — the discussion may produce a
better hybrid):

- **A. Procedural-plus**: fix the diagnosed defects (columnar quadruped
  legs, unified leg+foot silhouettes, gradient/junction unification,
  small-head face scaling) and re-verify against the bible. Cheapest;
  ceiling uncertain but the named defects are all tractable.
- **B. Hybrid authored parts**: procedural body/morphing + hand-authored
  topology-matched heads (and possibly feet) for the roster; spike-proven
  mechanics; content cost scales with roster; needs a species-data
  addition + DECISIONS row.
- **C. Commissioned art against the rig**: a real illustrator (or
  owner-authored art, AI-concepted then hand-traced per the license policy)
  produces the part library that B consumes. Highest ceiling; real money
  and coordination; the style bible becomes the commission brief.
- **D. Re-scope the bar**: accept the current look for launch (it is a
  large, shipped improvement), cut over per D-018, and schedule art
  investment post-launch with real-user feedback.

Whatever is chosen: record it as a new row in `docs/rebuild/DECISIONS.md`
(owner accepts it explicitly), update ROADMAP (reshape the pre-launch plan
and D-018 gating accordingly), and only then write implementation kickoff
prompt(s) sized like the existing `*-KICKOFF.md` docs.

## Ground rules

- The owner decides; you surface tradeoffs *before* anything is built. If a
  direction conflicts with an ACCEPTED decision, name the conflict in one
  sentence and ask which wins (AGENT-GUIDE).
- Hard invariants are not on the table: same genome → identical SVG; pure
  renderer; blending must stay smooth across the whole roster including
  pins and hybrids; live-morph stays smooth on a school Chromebook; no
  franchise designs; no fabricated content.
- Everything visual gets *looked at* before it's discussed — render probes,
  screenshot them, attach them to the conversation.
