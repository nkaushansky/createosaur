# Createosaur v3 — Decision Log

Status values: **ACCEPTED** (build to this) · **PROPOSED** (Fable
recommendation, awaiting owner) · **OPEN** (genuinely undecided) ·
**DEFERRED** (decide at the noted milestone).

| ID | Decision | Status | Notes |
|---|---|---|---|
| D-001 | v2 is end-of-life; v3 is a ground-up rebuild | **ACCEPTED** | Owner call, 2026-07-10. v2 defects catalogued in the session review: broken anonymous generation import, phantom credit system, spoofable trial limits, fabricated SEO ratings, `strict:false`, no tests |
| D-002 | Live site is left as-is during the rebuild; no v2 triage work | **ACCEPTED** | Owner call, 2026-07-10. All effort goes to v3; v2's known breakage is accepted until parity |
| D-003 | Creature is data; deterministic render is the core; AI is a finishing layer | **ACCEPTED** | The central thesis. Validated by Morph Lab prototype |
| D-004 | Two-layer genome: DNA sliders (influence) + part pins (ownership) | **ACCEPTED** | Owner endorsed the Lego-JW extension explicitly |
| D-005 | Rebuild in this repo: `apps/` + `packages/`, v2 → `legacy/` | **ACCEPTED** | Owner call, 2026-07-10. Keeps domain/Vercel/Supabase wiring and history |
| D-006 | v1 roster is terrestrial-only; marine/flyers are expansion packs | **ACCEPTED** | Owner call, 2026-07-10. One body topology = tractable morphospace. Mosasaurus fans are served in M6 with a proper waterline moment |
| D-007 | Gene pool capped at 4 species | **ACCEPTED** | Naming, UI, and blend legibility; matches prototype |
| D-008 | Audience: all-ages playful, kid-safe by construction ("playful field-science") | **ACCEPTED** | Owner call, 2026-07-10. Full parts picker + genome viewer stay; tone per VISION |
| D-009 | Sharing/remix ships at M2; breeding at M4 | **ACCEPTED** | Owner call, 2026-07-10. Growth loop before retention loop |
| D-010 | Monetization design deferred to M5; no payment UI (real or fake) before then | **ACCEPTED** | v2's phantom "50 for $5" is the cautionary tale |
| D-011 | No battle mode; stats are a conversation piece | **PROPOSED** | Revisit only if organic demand appears; battle balance is a different game |
| D-012 | Stack: Next.js (static export through M1)/strict TS/Tailwind/Zustand, pure-TS renderer package | **ACCEPTED** | Amended 2026-07-10 by D-016: Supabase and Vercel dropped from the stack |
| D-016 | Own-it-ourselves hosting posture: DreamHost static files (M0–M1), self-hosted Node share service + SQLite/MySQL on DreamHost VPS (M2+), self-hosted magic-link auth (M3, Supabase-auth-only as fallback). Third-party floor: AI model APIs + Stripe (M5) | **ACCEPTED** | Owner call, 2026-07-10: minimize third-party runtime dependence. Cost note: M2+ wants a DreamHost VPS (~$10–15/mo); shared hosting can't run Node reliably |
| D-017 | Analytics: none in M0–M1. Owner's existing GA property (`G-WZJN21ZWVD`, in `legacy/index.html`) is available for reuse; add analytics at M2 alongside the share loop (activation/share/remix metrics per VISION), owner signs off on implementation before it ships (CLAUDE.md: data collection needs owner approval). A fresh campaign/property is equally fine — decide at M2 | **ACCEPTED** | Owner call, 2026-07-10. The v2 Supabase `analytics_events` table is not carried forward |
| D-018 | v3 merges to `main` from M0 onward; the live Vercel v2 deploy is knowingly broken by this (negligible traffic). Owner cuts DNS to DreamHost and uploads `apps/web/out/` manually at end of M1 | **ACCEPTED** | Owner call, 2026-07-10. Supersedes the "set Vercel root to legacy/" option |
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
