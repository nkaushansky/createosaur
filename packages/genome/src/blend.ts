import {
  getSpecies,
  MORPH_KEYS,
  SLOT_PARAMS,
  type FeatureKind,
  type MorphVector,
  type SpeciesDef,
  type SpeciesId,
} from '@createosaur/species-data';
import { mulberry32 } from './prng';
import type { AgeStage, Genome } from './types';
import { slotWeights, speciesByWeight, type Weights } from './weights';

/**
 * How a species id resolves to its definition. Defaults to the frozen
 * database; the dev species workbench passes an override so an unsaved,
 * in-progress vector renders through the exact production pipeline
 * (ARCHITECTURE §species data pipeline). Never used to fabricate shipped data.
 */
export type SpeciesResolver = (id: SpeciesId) => SpeciesDef;

/** Feature expression ramp (GAME-DESIGN §3.2): pops in past ~20%, full by ~55%. */
export const FEATURE_RAMP = { start: 0.18, end: 0.55 } as const;

/** Seeded micro-variation bound (GAME-DESIGN §3.5): ±3% on morph parameters. */
export const JITTER = 0.03;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export interface FeatureExpression {
  intensity: number;
  /** dominant carrier — decides the variant when carriers disagree (M1+) */
  carrier: SpeciesId;
}

export interface BlendResult {
  /** blended, age-transformed, seed-jittered morph parameters */
  morph: MorphVector;
  features: Partial<Record<FeatureKind, FeatureExpression>>;
  /** overall display scale: genome size × age scale */
  displayScale: number;
  age: AgeStage;
}

/**
 * Age is a transform, not new data (GAME-DESIGN §3.4): hatchlings get a
 * proportionally bigger head, shorter snout/neck/tail and stubbier legs;
 * juveniles interpolate halfway. Multipliers apply to the blended vector.
 */
const AGE_TRANSFORM: Record<AgeStage, Partial<Record<keyof MorphVector, number>>> = {
  hatchling: {
    headSize: 1.45,
    snoutLen: 0.6,
    neckLen: 0.75,
    bodyLen: 0.85,
    tailLen: 0.7,
    fLegLen: 0.85,
    archUp: 0.8,
  },
  juvenile: {
    headSize: 1.2,
    snoutLen: 0.8,
    neckLen: 0.88,
    bodyLen: 0.93,
    tailLen: 0.85,
    fLegLen: 0.93,
    archUp: 0.9,
  },
  adult: {},
};

const AGE_SCALE: Record<AgeStage, number> = { hatchling: 0.55, juvenile: 0.8, adult: 1 };

/** genome.size 0–100 → display scale 0.6–1.3 (prototype range). */
export function sizeScale(size: number): number {
  return 0.6 + (Math.min(100, Math.max(0, size)) / 100) * 0.7;
}

/**
 * The core morphing computation (GAME-DESIGN §3): per-slot weighted average
 * in the shared morphospace, feature threshold ramps, age transform, and
 * seeded ±3% jitter. Pure and deterministic: same genome → same result.
 */
export function blendGenome(genome: Genome, resolve: SpeciesResolver = getSpecies): BlendResult {
  // 1. Weighted average per parameter, using the owning slot's weights.
  const morph = {} as MorphVector;
  const weightsBySlot: Partial<Record<string, Weights>> = {};
  for (const slot of Object.keys(SLOT_PARAMS) as (keyof typeof SLOT_PARAMS)[]) {
    weightsBySlot[slot] = slotWeights(genome, slot);
  }
  for (const slot of Object.keys(SLOT_PARAMS) as (keyof typeof SLOT_PARAMS)[]) {
    const w = weightsBySlot[slot]!;
    for (const key of SLOT_PARAMS[slot]) {
      let v = 0;
      for (const d of genome.dna) {
        v += (w[d.species] ?? 0) * resolve(d.species).morph[key];
      }
      morph[key] = v;
    }
  }

  // 2. Feature expression: ramp on the summed weight of carrier species in
  //    the feature's slot; dominant carrier decides the variant.
  const features: Partial<Record<FeatureKind, FeatureExpression>> = {};
  const kinds = new Set<FeatureKind>();
  for (const d of genome.dna) {
    for (const f of resolve(d.species).features) kinds.add(f.kind);
  }
  for (const kind of kinds) {
    let carrierWeight = 0;
    const carrierWeights: Weights = {};
    for (const d of genome.dna) {
      const gene = resolve(d.species).features.find((f) => f.kind === kind);
      if (!gene) continue;
      const w = slotWeights(genome, gene.slot)[d.species] ?? 0;
      carrierWeight += w;
      carrierWeights[d.species] = w;
    }
    const intensity = smoothstep(FEATURE_RAMP.start, FEATURE_RAMP.end, carrierWeight);
    if (intensity > 0.001) {
      const carrier = speciesByWeight(carrierWeights)[0]!;
      features[kind] = { intensity, carrier };
    }
  }

  // 3. Age transform.
  const ageMul = AGE_TRANSFORM[genome.age];
  for (const key of MORPH_KEYS) {
    const mul = ageMul[key];
    if (mul !== undefined) morph[key] = morph[key] * mul;
  }

  // 4. Seeded micro-variation: one jitter draw per parameter, order fixed by
  //    MORPH_KEYS so results are stable across runtimes.
  const rand = mulberry32(genome.seed);
  for (const key of MORPH_KEYS) {
    morph[key] = morph[key] * (1 + (rand() - 0.5) * 2 * JITTER);
  }

  return {
    morph,
    features,
    displayScale: sizeScale(genome.size) * AGE_SCALE[genome.age],
    age: genome.age,
  };
}
