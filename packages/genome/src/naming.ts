import { getSpecies } from '@createosaur/species-data';
import type { Genome } from './types';
import { identityWeights, speciesByWeight } from './weights';

export interface CreatureName {
  /** composed display name, e.g. "Tyrannoceratosaurus" */
  name: string;
  /** playful binomial subtitle, e.g. "Tyrannoceratosaurus chimaera" */
  binomial: string;
}

/** Nearly-pure creatures keep their real species name (GAME-DESIGN §5). */
export const PURE_THRESHOLD = 0.88;
/** Below this, a third species is too faint to earn a syllable. */
export const TRACE_THRESHOLD = 0.07;

/**
 * Compose a name from identity weights (DNA + pins, D-014):
 * pure → real name · two-species → prefix+duo · three-way → prefix+mid+suffix.
 */
export function composeName(genome: Genome): CreatureName {
  const w = identityWeights(genome);
  const order = speciesByWeight(w);
  const a = order[0]!;
  const wa = w[a] ?? 0;

  // ≥ with a float epsilon: an integer 88/12 mix accumulates identity weight
  // as five (0.88)/5 additions and lands at 0.8799999…, which the docs (and
  // the placard, which rounds to "88%") say IS pure. GAME-DESIGN §5.
  if (wa >= PURE_THRESHOLD - 1e-9 || order.length === 1) {
    const sp = getSpecies(a);
    return { name: sp.name, binomial: sp.facts.scientificName };
  }

  const b = order[1]!;
  const c = order[2];
  const sa = getSpecies(a).syllables;
  const sb = getSpecies(b).syllables;

  let name: string;
  if (!c || (w[c] ?? 0) < TRACE_THRESHOLD) {
    name = sa.prefix + sb.duo;
  } else {
    name = sa.prefix + sb.mid + getSpecies(c).syllables.suffix;
  }
  return { name, binomial: `${name} chimaera` };
}
