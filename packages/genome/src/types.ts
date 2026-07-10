import { z } from 'zod';
import { isSpeciesId, PART_SLOTS, type PartSlot, type SpeciesId } from '@createosaur/species-data';

export const GENOME_VERSION = 1 as const;

export type AgeStage = 'hatchling' | 'juvenile' | 'adult';
export type Pattern = 'solid' | 'stripes' | 'spots' | 'rings' | 'countershade';

export const PATTERNS: readonly Pattern[] = ['solid', 'stripes', 'spots', 'rings', 'countershade'];
export const AGE_STAGES: readonly AgeStage[] = ['hatchling', 'juvenile', 'adult'];

/** Maximum species in the gene pool (D-007). */
export const POOL_CAP = 4;

export interface DnaEntry {
  species: SpeciesId;
  /** raw slider value ≥ 0; normalized shares are derived, never stored */
  share: number;
}

/**
 * The genome — the durable identity of a creature (GAME-DESIGN §2).
 * Everything (render, name, stats, offspring) is a pure function of this.
 */
export interface Genome {
  v: typeof GENOME_VERSION;
  dna: DnaEntry[];
  /** Lego layer: a pinned slot uses that species 100%, regardless of shares */
  parts: Partial<Record<PartSlot, SpeciesId>>;
  cosmetics: {
    hide: string;
    markings: string;
    pattern: Pattern;
  };
  /** 0–100 display/stat scale relative to the blend's natural size */
  size: number;
  age: AgeStage;
  /** micro-variation identity; set at creation, never silently re-rolled */
  seed: number;
}

const hexColor = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, 'expected #rrggbb hex color')
  .transform((s) => s.toLowerCase());

const speciesId = z.string().refine(isSpeciesId, { message: 'unknown species id' });

export const genomeSchema = z
  .object({
    v: z.literal(GENOME_VERSION),
    dna: z
      .array(z.object({ species: speciesId, share: z.number().min(0).max(100) }))
      .min(1)
      .max(POOL_CAP)
      .refine(
        (dna) => new Set(dna.map((d) => d.species)).size === dna.length,
        { message: 'duplicate species in gene pool' }
      ),
    parts: z
      .record(z.enum(PART_SLOTS as [PartSlot, ...PartSlot[]]), speciesId)
      .default({}),
    cosmetics: z.object({
      hide: hexColor,
      markings: hexColor,
      pattern: z.enum(PATTERNS as [Pattern, ...Pattern[]]),
    }),
    size: z.number().min(0).max(100),
    age: z.enum(AGE_STAGES as [AgeStage, ...AgeStage[]]),
    seed: z.number().int().nonnegative(),
  })
  .refine(
    (g) => Object.values(g.parts).every((sp) => g.dna.some((d) => d.species === sp)),
    { message: 'pinned species must be in the gene pool' }
  );

/** Parse and validate an untrusted genome (e.g. from a share URL). */
export function parseGenome(data: unknown): Genome {
  return genomeSchema.parse(data) as Genome;
}

export function isValidGenome(data: unknown): data is Genome {
  return genomeSchema.safeParse(data).success;
}

/** A sensible starter genome: the classic three-way lab bench. */
export function defaultGenome(): Genome {
  return {
    v: GENOME_VERSION,
    dna: [
      { species: 'tyrannosaurus', share: 100 },
      { species: 'triceratops', share: 0 },
      { species: 'stegosaurus', share: 0 },
    ],
    parts: {},
    cosmetics: { hide: '#6b8f4e', markings: '#d9a441', pattern: 'solid' },
    size: 55,
    age: 'adult',
    seed: 1,
  };
}
