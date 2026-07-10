# Createosaur v3 — Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript `strict`** | Server rendering for creature share pages + OG images — the growth loop requires it; Vite SPA (v2) structurally couldn't do this |
| Styling | Tailwind + a small token layer | Team familiarity; tokens make theme + Opus-latitude styling safe |
| State | Zustand (lab store) | The genome is ONE object; v2's 25 useStates was the anti-pattern |
| Backend | **Supabase** (auth, Postgres, storage) — kept from v2 | Working knowledge + existing project; schema is new |
| Hosting | **Vercel** — kept from v2 | Existing domain wiring |
| Tests | Vitest (unit) + Playwright (smoke + screenshots) | The verify loop in AGENT-GUIDE depends on these |

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
(live morphing), an edge route (OG images), and tests (golden snapshots).
One function: `renderCreature(genome, opts) => string /* svg */`, plus
`renderPart(species, slot, opts)` for picker vignettes.

## Data model (Supabase)

```sql
creatures (
  id            uuid pk default gen_random_uuid(),
  owner_id      uuid null references auth.users,   -- null = anonymous, claimable
  claim_token   uuid null,                          -- lets an anon claim later
  name          text not null,
  genome        jsonb not null,                     -- versioned Genome object
  genome_v      int  not null,
  parent_a      uuid null references creatures(id), -- breeding lineage
  parent_b      uuid null references creatures(id),
  remixed_from  uuid null references creatures(id),
  is_public     bool not null default false,
  remix_count   int  not null default 0,
  created_at    timestamptz default now()
)
-- RLS: owners full CRUD on own rows; public rows readable by all;
-- anon rows writable only via claim_token.
```

Notes:
- **No images in the database.** The render is derived from `genome` on
  demand. AI portraits (M5) go to Supabase Storage; the row stores a URL.
- Local-first: unauthenticated players keep creatures in localStorage
  (genomes are ~1 KB — thousands fit; v2 stored megabyte base64 images and
  hit quota at 3). Sign-in merges local dex into cloud, once, explicitly.

## Rendering pipelines

1. **Live lab**: lab store (genome) → `renderCreature` → inline SVG. Target
   <8 ms per frame on a school Chromebook; memoize per-slot geometry if
   needed (prototype rendered full rebuilds well under budget).
2. **Share page OG**: `GET /c/:id/opengraph-image` → load genome →
   `renderCreature` → SVG → PNG via `@resvg/resvg-wasm` on the edge runtime.
   The creature IS the share card; add the placard strip (name, %s) around it.
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
| Supabase project + auth flow patterns | new schema, same service |
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
