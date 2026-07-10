import { getSpecies, SPECIES_IDS, type Diet, type SpeciesId } from '@createosaur/species-data';

/**
 * Species-browser data helpers (GAME-DESIGN §4). The browser feeds the gene
 * pool and filters by period, diet, and size — the three axes the roster
 * naturally varies along. Size is bucketed from the real length so the filter
 * stays honest (no invented size field).
 */
export type SizeBucket = 'Small' | 'Medium' | 'Large' | 'Huge';

export const SIZE_BUCKETS: readonly SizeBucket[] = ['Small', 'Medium', 'Large', 'Huge'];

export function sizeBucket(lengthMeters: number): SizeBucket {
  if (lengthMeters < 4) return 'Small';
  if (lengthMeters < 9) return 'Medium';
  if (lengthMeters < 16) return 'Large';
  return 'Huge';
}

/** Distinct periods present in the roster, oldest first. */
const PERIOD_ORDER = [
  'Triassic',
  'Early Jurassic',
  'Late Jurassic',
  'Early Cretaceous',
  'Late Cretaceous',
];

export function allPeriods(): string[] {
  const present = new Set(SPECIES_IDS.map((id) => getSpecies(id).facts.period));
  const known = PERIOD_ORDER.filter((p) => present.has(p));
  // include any period not in the known order (defensive), appended stably
  const extra = [...present].filter((p) => !PERIOD_ORDER.includes(p)).sort();
  return [...known, ...extra];
}

export function allDiets(): Diet[] {
  const present = new Set(SPECIES_IDS.map((id) => getSpecies(id).facts.diet));
  const order: Diet[] = ['Carnivore', 'Piscivore', 'Omnivore', 'Herbivore', 'Insectivore'];
  return order.filter((d) => present.has(d));
}

export interface BrowserFilters {
  query: string;
  diets: ReadonlySet<Diet>;
  periods: ReadonlySet<string>;
  sizes: ReadonlySet<SizeBucket>;
}

export const EMPTY_FILTERS: BrowserFilters = {
  query: '',
  diets: new Set(),
  periods: new Set(),
  sizes: new Set(),
};

/** Filtered, name-sorted species ids. Empty filter groups match everything. */
export function filterSpecies(f: BrowserFilters): SpeciesId[] {
  const q = f.query.trim().toLowerCase();
  return SPECIES_IDS.filter((id) => {
    const sp = getSpecies(id);
    if (q && !sp.name.toLowerCase().includes(q) && !sp.facts.scientificName.toLowerCase().includes(q)) {
      return false;
    }
    if (f.diets.size && !f.diets.has(sp.facts.diet)) return false;
    if (f.periods.size && !f.periods.has(sp.facts.period)) return false;
    if (f.sizes.size && !f.sizes.has(sizeBucket(sp.facts.lengthMeters))) return false;
    return true;
  }).sort((a, b) => getSpecies(a).name.localeCompare(getSpecies(b).name));
}
