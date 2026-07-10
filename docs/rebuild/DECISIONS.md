# Createosaur v3 — Decision Log

Status values: **ACCEPTED** (build to this) · **PROPOSED** (Fable
recommendation, awaiting owner) · **OPEN** (genuinely undecided) ·
**DEFERRED** (decide at the noted milestone).

| ID | Decision | Status | Notes |
|---|---|---|---|
| D-001 | v2 is end-of-life; v3 is a ground-up rebuild | **ACCEPTED** | Owner call, 2026-07-10. v2 defects catalogued in the session review: broken anonymous generation import, phantom credit system, spoofable trial limits, fabricated SEO ratings, `strict:false`, no tests |
| D-002 | What happens to the live site during the rebuild | **OPEN** | Options: (a) M-1 triage fixes, keep it running; (b) teaser page; (c) leave as-is. Cost of (a) is ~½ day |
| D-003 | Creature is data; deterministic render is the core; AI is a finishing layer | **ACCEPTED** | The central thesis. Validated by Morph Lab prototype |
| D-004 | Two-layer genome: DNA sliders (influence) + part pins (ownership) | **ACCEPTED** | Owner endorsed the Lego-JW extension explicitly |
| D-005 | Rebuild in this repo (`apps/` + `packages/`, v2 → `legacy/`) vs fresh repo | **PROPOSED: this repo** | Keeps domain/Vercel/Supabase wiring and history; session access is already scoped here. Fresh repo only if owner wants a clean public showcase |
| D-006 | v1 roster is terrestrial-only; marine/flyers are expansions | **PROPOSED** | One body topology = tractable morphospace. Mosasaurus fans are served in M6 with a proper waterline moment |
| D-007 | Gene pool capped at 4 species | **ACCEPTED** | Naming, UI, and blend legibility; matches prototype |
| D-008 | Audience center of gravity: all-ages playful, kid-safe by construction ("playful field-science") | **PROPOSED** | Alternative: kids-first (simpler UI, bigger targets, less text) — changes copy depth and picker density everywhere, so decide before M0 |
| D-009 | Breeding ships at M4, after the sharing loop (M2), not at launch | **PROPOSED** | Toy-first sequencing; breeding needs an audience to breed *for*. Alternative: breeding-first for retention-led growth |
| D-010 | Monetization design deferred to M5; no payment UI (real or fake) before then | **ACCEPTED** | v2's phantom "50 for $5" is the cautionary tale |
| D-011 | No battle mode; stats are a conversation piece | **PROPOSED** | Revisit only if organic demand appears; battle balance is a different game |
| D-012 | Stack: Next.js/strict TS/Tailwind/Zustand/Supabase/Vercel, pure-TS renderer package | **ACCEPTED** | See ARCHITECTURE for rationale |
| D-013 | Domains: createosaur.com primary; buildasaur.us 301-redirects to it; never mirrored | **ACCEPTED** | Owner call, 2026-07-10 session |
| D-014 | Names/stats derive from identity weights (DNA + pins), not DNA alone | **ACCEPTED** | Prototype-validated: pinned Trike head on 100% T-Rex = "Tyrannoceratosaurus" |
| D-015 | Anonymous play is local-first; server storage only for shared creatures (claimable) | **ACCEPTED** | Kid-safety posture + v2 localStorage-quota lesson (store genomes, never images) |

## How to use this log

- Implementing sessions (Opus): treat ACCEPTED as law, PROPOSED as law-unless-
  the-owner-says-otherwise-this-session, OPEN as "ask before touching".
- When the owner decides a PROPOSED/OPEN item in conversation, update the row
  in the same PR as the work it unblocks.
- New decisions of consequence get a new row. Color/layout/copy iterations do
  **not** — that's normal latitude, not a decision.
