# Claude Code Collaboration Guide

This file explains what Claude Code should assume after the art pipeline work.

## 1. What has already been decided

The approved direction is no longer:

- purely procedural SVG only
- “realism later in an AI portrait layer”

The approved direction is now:

- authored 2D editorial illustration
- deterministic live deformation
- local per-part pattern masks
- a bounded illustrated-rig path developed in parallel

This means implementation work should **respect the new asset pipeline** rather than recreate the old constraints.

---

## 2. What Claude Code should trust

Claude Code should trust that:

- the approved T. rex establishes the correct visual family
- the exact-source layer pack is the source of truth for IR0
- the hidden overlap strategy is intentional
- local per-layer masks are required
- the illustrated rig is being validated in parallel, not replacing production by default

---

## 3. What Claude Code should not do

Claude Code should not:

- silently redesign the dinosaur
- simplify the art direction for coding convenience
- change production `/lab`
- change genome schema without explicit approval
- modify `packages/renderer/**` for IR0
- claim the illustrated path is production-ready without the owner’s visual approval
- replace approved art with substituted/generated alternatives

---

## 4. What Claude Code should receive from design

For any future species or trait pack, Claude Code should ideally receive:

- approved master illustration
- layer pack
- overlap-safe layers
- pattern masks
- optional trait pack
- contact sheet
- manifest / index
- acceptance checklist

If any of these are missing, implementation may still start experimentally, but the PR should say exactly what is provisional.

---

## 5. Preferred implementation boundary

For IR0/IR1/IR2, the clean division is:

### ChatGPT side
- visual generation
- art-direction iteration
- review sheets
- trait concepts
- pipeline docs

### Claude Code side
- repo integration
- route creation
- deterministic pose math
- mesh behavior
- tests
- build/export correctness
- screenshot capture / inspection

---

## 6. Repository hygiene rules

When implementing illustrated-rig work:

- isolate it from production `/lab`
- prefer a new package for reusable pure logic
- keep browser-specific rendering in `apps/web`
- preserve static export compatibility
- add tests for deterministic pose behavior
- preserve the existing renderer as fallback until approval

---

## 7. Review philosophy

A technically “working” rig is **not enough** if motion ruins the approved art.

Claude Code should treat these as equally important:

- correctness
- determinism
- seam integrity
- aesthetic preservation

If a deformation result is ugly, the right action is to report it honestly rather than pass the test by lowering visual standards.

---

## 8. Escalation points

Claude Code should stop and ask for direction if:

- the new species clearly needs a different layer breakdown
- the approved art cannot survive the requested motion range
- pattern masks do not align cleanly
- the route would require production-renderer changes
- the asset package appears incomplete or contradictory
- the documented decision log conflicts with the approved art direction

---

## 9. Future collaboration model

Best-practice loop:

1. ChatGPT creates / refines source assets
2. Claude Code integrates in repo
3. Claude produces screenshots and PR
4. ChatGPT and the owner review those screenshots
5. iterate until the result survives motion
6. only then promote the species/archetype further

That is the intended working model moving forward.
