import { PART_SLOTS, type PartSlot, type SpeciesId } from '@createosaur/species-data';
import type { Genome } from './types';

/** Map of pool species → weight in [0,1]. Only pool species appear as keys. */
export type Weights = Partial<Record<SpeciesId, number>>;

/**
 * Normalized DNA shares. All-zero sliders mean an equal blend — there is no
 * such thing as a null creature (GAME-DESIGN §9).
 */
export function normalizedShares(genome: Genome): Weights {
  const total = genome.dna.reduce((sum, d) => sum + d.share, 0);
  const out: Weights = {};
  for (const d of genome.dna) {
    out[d.species] = total > 0 ? d.share / total : 1 / genome.dna.length;
  }
  return out;
}

/**
 * Effective weights for one part slot: one-hot for a pinned slot, normalized
 * DNA shares otherwise. Pins are ownership; sliders are influence.
 */
export function slotWeights(genome: Genome, slot: PartSlot): Weights {
  const pin = genome.parts[slot];
  if (pin) {
    const out: Weights = {};
    for (const d of genome.dna) out[d.species] = d.species === pin ? 1 : 0;
    return out;
  }
  return normalizedShares(genome);
}

/**
 * Identity weights: the average of slot weights across all slots (D-014).
 * Pins therefore shift the creature's *identity* — its name, stats, and
 * placard — not just its geometry.
 */
export function identityWeights(genome: Genome): Weights {
  const out: Weights = {};
  for (const d of genome.dna) out[d.species] = 0;
  for (const slot of PART_SLOTS) {
    const w = slotWeights(genome, slot);
    for (const d of genome.dna) {
      out[d.species] = (out[d.species] ?? 0) + (w[d.species] ?? 0) / PART_SLOTS.length;
    }
  }
  return out;
}

/** Pool species ordered by descending weight (stable for equal weights). */
export function speciesByWeight(weights: Weights): SpeciesId[] {
  return (Object.keys(weights) as SpeciesId[]).sort(
    (a, b) => (weights[b] ?? 0) - (weights[a] ?? 0)
  );
}
