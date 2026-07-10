# M2 Kickoff Prompt — share & remix (the growth loop)

Paste into a fresh Claude Code session **after** the M1b fidelity pass has
merged and the owner has completed the DNS cutover (D-018). M2 is the first
milestone with server code — everything self-hosted per D-016.

---

Read `CLAUDE.md`, then `docs/rebuild/ARCHITECTURE.md` (data model, render
pipelines, D-016 hosting posture), `docs/rebuild/GAME-DESIGN.md` §7
(sharing & remixing) and §9 (name filter), the M2 section of
`docs/rebuild/ROADMAP.md`, and `docs/rebuild/DECISIONS.md` (D-016, D-017 are
load-bearing here). Follow `docs/rebuild/AGENT-GUIDE.md` including the
milestone review ritual.

Your task is **Milestone M2: share & remix**:

1. **`apps/share-service/`** — one small self-hosted Node service (Hono or
   Express; keep dependencies minimal — this runs on the owner's DreamHost
   VPS for years). SQLite via better-sqlite3, schema per ARCHITECTURE's
   `creatures` table (include `claim_token` and lineage columns now; they're
   cheap and M3/M4 need them). Endpoints:
   - `POST /api/creatures` — body `{name, genome}`. **`parseGenome` is the
     trust boundary — every byte of genome input goes through it.** Name
     passes the profanity filter (GAME-DESIGN §9). Rate-limit by IP
     (SQLite-backed, not in-memory — v2's in-memory limiter is the
     cautionary tale). Returns `{id, claimToken}`. Ids: short random slugs,
     unguessable enough that enumeration is boring.
   - `GET /c/:id` — server-rendered HTML: the creature (via
     `renderCreature`), placard data, remix link, and per-creature OG meta
     tags. This page is what unfurls in iMessage/Discord/Slack.
   - `GET /og/:id.png` — `renderCreature` → PNG via `@resvg/resvg-js`,
     composed with a placard strip (name + composition). Cache to disk by
     genome hash — deterministic renders make the cache trivially correct.
   - `GET /api/creatures/:id` — JSON `{name, genome, remix_count}` for the
     remix flow. Increment `remix_count` via a separate
     `POST /api/creatures/:id/remix` beacon.
2. **Lab integration** (`apps/web`): "Save & share" → POST → show the URL
   with a copy button (no auth — anonymous is claimable later via the
   stored token; persist the token in localStorage). Arriving at
   `/lab?remix=:id` fetches the genome, loads it into the store, and shows
   a "remixed from" credit. The static site reads the service's base URL
   from a build-time env var so local dev and DreamHost differ only in
   config.
3. **Fact drawer** on the placard: real per-species facts from
   `packages/species-data`, bus-for-scale length comparison. Honest layer,
   visually distinct from the playful fiction.
4. **Deployment story**: a `docs/rebuild/DEPLOY.md` with the DreamHost VPS
   recipe — Node via nvm, the service under systemd (unit file included),
   reverse proxy/subdomain notes (e.g. `share.createosaur.com` or `/api`
   proxied), SQLite file location + a one-line nightly backup cron, and how
   the static site's env var points at it. The owner deploys by hand;
   write it for a careful human, not a CI robot.
5. **Analytics (D-017)**: the owner's GA property `G-WZJN21ZWVD` may be
   reused OR a fresh property chosen — **ask the owner before adding any
   tracking**, then implement activation/share/remix events per VISION's
   metrics. Kid-safety posture applies (no PII, no fingerprinting — v2's
   canvas fingerprinting is the anti-pattern).
6. **Tests**: service unit tests (validation rejects prototype-chain ids —
   the schema tests exist, exercise them through the HTTP boundary; rate
   limiting; profanity filter), an OG snapshot test (PNG bytes stable for a
   fixed genome), and e2e for the share→remix round trip (run the service
   locally in the Playwright webServer config alongside the static site).

Hard rules: renderer/genome packages stay pure (the service imports them —
that was the whole point); genome schema changes need owner approval; no
third-party runtime services (D-016) — the floor is your own VPS.

DoD is the M2 section of ROADMAP.md: a shared link unfurls with the creature
as its card, and the remix round-trip works logged-out.

---

## Notes for the owner

- Before this session: provision the DreamHost VPS (Node-capable) and
  decide the service's hostname (subdomain vs path).
- During: expect one AskUserQuestion about analytics (GA reuse vs fresh).
- After merge: follow `DEPLOY.md` to stand the service up, then run the
  milestone review ritual (AGENT-GUIDE) in a fresh session before
  announcing anything.
