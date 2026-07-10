# Createosaur v3 — Vision

## Thesis

**"Mix DNA and traits of different dinosaurs and create new hybrid dinosaurs"**
— delivered as a toy you can *feel*, not a form that writes an AI prompt.

Three principles fix everything that was wrong with v2:

1. **A creature is data, not an image.** The genome (a small JSON object) is
   the durable thing. Renders, share cards, stats, names, offspring — all pure
   functions of it. This unlocks remixing, breeding, trading, and consistency.
2. **Deterministic first, AI as the reward.** The core loop (slide DNA →
   creature morphs) is instant, free, and offline-capable. AI enters only as
   the optional "portrait" finish — slow, gorgeous, and a natural paid moment.
3. **The 10-second first hit.** Land → creature already on screen → touch one
   slider → it visibly changes. No auth wall, no tab maze, no diffusion wait
   before the first dopamine.

Strategy shorthand: **A-core, B-layer, C-seasoning** —
the instant morphing toy (A) is the heart; breeding/collection (B) is the
retention layer; real paleontology flavor (C) is the personality.

## Audience

Primary personas (feature priorities map to these):

| Persona | Who | What they want | Features that serve them |
|---|---|---|---|
| **The Kid** (~6–12) | plays on a parent's phone/tablet or school Chromebook | instant visual payoff, silly names, "MINE" | sliders, randomize, naming, hatchling age stage, zero reading required to have fun |
| **The Tinkerer** (8–99) | the Lego-instructions-optional type | control, mastery, weird combos | parts picker, pins, extreme mixes, genome viewer, rare part unlocks |
| **The Dino Nerd** (any age) | knows Spinosaurus had a sail, will call us out | accuracy where it counts, deep cuts | real species facts, era/diet chips, "epoch: impossible" jokes that prove we know the rules we're breaking |
| **The Collector/Sharer** | plays social games, shares creations | ownership, rarity, showing off | dex, breeding, lineage, share cards, remix chains |

Tone: **playful field-science**. A museum placard written by someone having
fun. Never babyish, never edgy. The joke register is "Omnivore (allegedly)".

Kids' safety posture: playable with zero account and zero data entry.
Accounts are for saving/sharing and are framed at parents/older users. No
chat, no free-text visible to other users except creature names (filtered).
This posture is a product feature, not just compliance.

## Pillars (rank-ordered; when features fight, higher wins)

1. **Instant consequence** — every control visibly changes the creature *now*.
2. **Ownership** — name it, keep it, breed it, point at it: "I made this."
3. **Shareability** — every creature has a URL and a beautiful card; remixing
   credits the source.
4. **Honest science flavor** — real facts, clearly separated from playful
   fiction.
5. **Delight density** — names, chips, stats, and micro-copy do comedic work.

## Non-goals (v3 explicitly does NOT)

- Compete with Midjourney as a general AI art tool.
- Real-time multiplayer or user-to-user chat.
- 3D rendering (the 2D field-guide look is the brand; 3D is a someday-maybe).
- Marine reptiles & pterosaurs in v1 (separate body archetypes; planned as
  expansions — see GAME-DESIGN §archetypes).
- Simulation-grade paleontology. We are a toy with good manners about facts.

## Monetization posture

Nothing is gated in the core toy: mixing, morphing, saving locally, sharing
are free forever (they cost us ~nothing — that's the point of determinism).
Candidate paid layer, in likely order of introduction:

1. **AI portraits** (credits) — the natural "print my creature" moment.
2. **Cosmetic packs** (patterns/palettes) — pure vanity, kid-ethical.
3. **Classroom license** — if the education seasoning finds real teacher use.

Decision status: deferred until M5 (see DECISIONS.md D-010). No payment code
before then; also no *fake* payment UI before then — v2's phantom credit
system is the cautionary tale.

## Success metrics (keep it honest and small)

- **Activation**: % of visitors who move a slider within 10s of load.
- **Creation**: % who save or name a creature.
- **Growth loop**: % of sessions arriving via a shared creature URL; remixes
  per shared creature.
- **Retention (post-M4)**: return rate of users with ≥1 bred creature.
