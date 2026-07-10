# Createosaur v3 — Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript `strict`**, built with **`output: 'export'`** through M1 | Static export = plain files, hostable on owner's DreamHost with zero third-party runtime (D-016); the same codebase flips to a Node server at M2 when share pages need one |
| Styling | Tailwind + a small token layer | Team familiarity; tokens make theme + Opus-latitude styling safe |
| State | Zustand (lab store) | The genome is ONE object; v2's 25 useStates was the anti-pattern |
| Backend | **None until M2.** Then: one small self-hosted Node service + **SQLite (or DreamHost MySQL)** | The renderer is pure TS, so share pages/OG images are a ~200-line owned service — no Supabase, no Vercel functions |
| Auth (M3) | Self-hosted **magic-link email** (DreamHost SMTP), no passwords stored | Small attack surface, fully owned. Supabase-for-auth-only is the documented fallback if this proves heavy — decide at M3 |
| Hosting | **DreamHost** (owner's account): static files (shared plan) through M1; DreamHost VPS for the M2+ Node service | D-016: own everything ownable. Third-party floor = AI model APIs + Stripe (M5), unavoidable |
| Tests | Vitest (unit) + Playwright (smoke + screenshots) | The verify loop in AGENT-GUIDE depends on these |

Deployment M0–M1: `npm run build` emits `apps/web/out/` — rsync/SFTP it to
DreamHost. No build step on the server, no runtime, no lock-in. Deploys are
literally file copies; rollback is copying the previous folder back.

## Repo layout (monorepo-lite, single package.json workspace)

```
apps/web/                 # Next.js app (routes, UI components, lab)
packages/genome/          # schema, validation (zod), blending math, naming, stats
packages/renderer/        # genome → SVG string. PURE. No DOM, no React, no I/O.
packages/species-data/    # the species database + morph vectors + syllables + stats
docs/rebuild/             # this documentation set (design authority)
legacy/                   # frozen v2 code (moved, not deleted) until v3 reaches parity
```

Dependency rule (enforced by lint): `renderer` depends only on `genome` +
`species-data`. `apps/web` may depend on all three. Nothing depends on
`apps/web`.

**Why the renderer must stay pure:** it runs in three places — the browser
(live morphing), the self-hosted share service (OG images, M2), and tests
(golden snapshots).
One function: `renderCreature(genome, opts) => string /* svg */`, plus
`renderPart(species, slot, opts)` for picker vignettes.

## Data model (M2+, self-hosted SQLite/MySQL)

```sql
creatures (
  id            text primary key,        -- short random slug for /c/:id URLs
  owner_id      text null,               -- null = anonymous, claimable
  claim_token   text null,               -- lets an anon claim later (M3)
  name          text not null,
  genome        text not null,           -- versioned Genome JSON (~1 KB)
  genome_v      integer not null,
  parent_a      text null references creatures(id), -- breeding lineage
  parent_b      text null references creatures(id),
  remixed_from  text null references creatures(id),
  is_public     integer not null default 0,
  remix_count   integer not null default 0,
  created_at    text not null            -- ISO 8601
)
-- Access rules enforced in the service layer (single owned codepath):
-- owners full CRUD on own rows; public rows readable by all;
-- anon rows writable only via claim_token.
```

Notes:
- **No images in the database.** The render is derived from `genome` on
  demand. AI portraits (M5) are files on the same host (or DreamObjects,
  DreamHost's S3-compatible storage, if disk becomes a concern); the row
  stores a path.
- Local-first: unauthenticated players keep creatures in localStorage
  (genomes are ~1 KB — thousands fit; v2 stored megabyte base64 images and
  hit quota at 3). Sign-in merges local dex into cloud, once, explicitly.

## Rendering pipelines

1. **Live lab**: lab store (genome) → `renderCreature` → inline SVG. Target
   <8 ms per frame on a school Chromebook; memoize per-slot geometry if
   needed (prototype rendered full rebuilds well under budget).
2. **Share page OG (M2)**: the self-hosted share service — `GET /c/:id`
   (HTML with per-creature meta tags) and `GET /og/:id.png` (load genome →
   `renderCreature` → SVG → PNG via `@resvg/resvg-js`). One small Node
   process on the DreamHost VPS behind the domain; it imports the same
   renderer package the browser uses. The creature IS the share card; add
   the placard strip (name, %s) around it.
3. **Picker vignettes**: `renderPart` with crop viewBox; rendered client-side,
   cached by (species, slot) — the inputs are static per session.
4. **AI portraits (M5)**: server route → provider adapter (img2img with the
   SVG render as control image; genome-hash seed) → Storage → URL on row.
   Strict per-user credits + a global daily budget breaker. Keys server-side
   only. Never in the client bundle.

## Species data pipeline

`packages/species-data` is the single source of truth, extending the
salvaged v2 database (43 species with real length/weight/diet/period/facts):

```ts
interface SpeciesDef extends LegacySpeciesFacts {
  archetype: 'theropod'|'ceratopsian'|'armored'|'sauropod'|'ornithopod'|'marine'|'flyer';
  morph: MorphVector;            // ~40 shared anatomical parameters
  features: FeatureGenes;        // headgear/backgear/tailgear/integument variants
  syllables: { prefix: string; mid: string; suffix: string };
  stats: { attack: number; defense: number; speed: number; brains: number };
  inV1: boolean;                 // terrestrial roster flag
}
```

Authoring morph vectors is the big data task of M1. Process: tune per-species
in a dev-only "species workbench" route (sliders for every parameter, side-by-
side with reference art), then commit the vector. Budget ~15–30 min/species
after the first archetype exemplar of each body plan exists.

## Salvage manifest from v2 (`legacy/`)

| Take | As |
|---|---|
| `src/data/dinosaurDatabase.ts` | seed for `packages/species-data` (facts layer) |
| `ScientificNameGenerator`, `BehavioralSimulator` | idea quarry for syllables/stats data — port concepts, not code |
| Supabase project | not carried forward (D-016) — decommission after v2 sunsets |
| Domain, GA property, OG/favicon assets | reuse |
| Everything else | leave in `legacy/`, delete at parity |

## Testing strategy (the invariants live here)

- **Golden genomes**: a fixture set of ~20 genomes (pure species, 2/3/4-way
  mixes, pinned chimeras, hatchlings, extremes) whose rendered SVG is
  snapshot-hashed. CI fails on any diff. Intentional renderer changes
  regenerate goldens in a dedicated commit with before/after screenshots in
  the PR.
- **Property tests** on blending: any valid genome → all morph params within
  archetype bounds; shares always normalize; feature intensity ∈ [0,1].
- **Playwright smoke**: load lab → drag slider → SVG mutates; pin part →
  name updates; share page renders; OG route returns image/png.
- **CI gate** (GitHub Actions): typecheck + lint + unit + smoke on every PR.
  v2 shipped a broken import because nothing gated merges; that class of
  failure must be structurally impossible here.

## Performance & footprint

- No heavy deps in the hot path: the renderer is string-building math.
- Species data code-split: facts/syllables load with the app; morph vectors
  are small (~40 floats × 40 species ≈ trivial) — ship all of it, no lazy
  complexity.
- v2's 40-component shadcn install: import only what's used this time.
