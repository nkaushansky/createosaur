import { getSpecies, type SpeciesId, type StatRow } from '@createosaur/species-data';
import type { Genome } from './types';
import { composeName, type CreatureName } from './naming';
import { identityWeights, speciesByWeight } from './weights';
import { genomeHash } from './prng';

export interface Placard extends CreatureName {
  /** e.g. "Specimen CS-4821" — stable per genome */
  specimen: string;
  /** real period of dominant contributors, or the epoch joke */
  periodChip: string;
  dietChip: string;
  /** weighted real-world scale of the blend */
  lengthMeters: number;
  weightKg: number;
  stats: StatRow;
  /** identity share per pool species, for the "drawn live from" line */
  composition: Array<{ species: SpeciesId; label: string; percent: number }>;
}

const SIGNIFICANT = 0.05;

/**
 * Everything the placard shows, derived from the genome (GAME-DESIGN §5).
 * Facts come straight from the species database; jokes are clearly jokes.
 */
export function derivePlacard(genome: Genome): Placard {
  const w = identityWeights(genome);
  const order = speciesByWeight(w);

  // Period: species contributing >25% vote; disagreement is the joke.
  const periods = new Set(
    order.filter((id) => (w[id] ?? 0) > 0.25).map((id) => getSpecies(id).facts.period)
  );
  const periodChip =
    periods.size > 1
      ? 'Epoch: impossible'
      : (periods.values().next().value ?? getSpecies(order[0]!).facts.period);

  // Diet: weighted carnivory score.
  let carn = 0;
  for (const id of order) {
    const diet = getSpecies(id).facts.diet;
    const meaty = diet === 'Carnivore' || diet === 'Piscivore' ? 1 : 0;
    carn += (w[id] ?? 0) * meaty;
  }
  const dietChip = carn > 0.55 ? 'Carnivore' : carn < 0.2 ? 'Herbivore' : 'Omnivore (allegedly)';

  // Real-world scale: weighted blend of true measurements, scaled by size.
  const sizeFactor = 0.6 + (genome.size / 100) * 0.8;
  let lengthMeters = 0;
  let weightKg = 0;
  for (const id of order) {
    lengthMeters += (w[id] ?? 0) * getSpecies(id).facts.lengthMeters;
    weightKg += (w[id] ?? 0) * getSpecies(id).facts.weightKg;
  }
  const ageFactor = genome.age === 'hatchling' ? 0.15 : genome.age === 'juvenile' ? 0.55 : 1;
  lengthMeters = round1(lengthMeters * sizeFactor * ageFactor);
  weightKg = Math.round(weightKg * sizeFactor * ageFactor);

  // Stats: linear in identity weights, gently modulated by size and age.
  const stats: StatRow = { attack: 0, defense: 0, speed: 0, brains: 0 };
  for (const id of order) {
    const row = getSpecies(id).stats;
    const wi = w[id] ?? 0;
    stats.attack += wi * row.attack;
    stats.defense += wi * row.defense;
    stats.speed += wi * row.speed;
    stats.brains += wi * row.brains;
  }
  const sizeBoost = (genome.size - 50) / 50; // −1..1
  stats.attack = clampStat(stats.attack * (1 + 0.1 * sizeBoost) * (genome.age === 'hatchling' ? 0.4 : 1));
  stats.defense = clampStat(stats.defense * (1 + 0.1 * sizeBoost));
  stats.speed = clampStat(stats.speed * (1 - 0.08 * sizeBoost));
  stats.brains = clampStat(stats.brains);

  const composition = order
    .filter((id) => (w[id] ?? 0) >= SIGNIFICANT)
    .map((id) => ({
      species: id,
      label: getSpecies(id).name,
      percent: Math.round((w[id] ?? 0) * 100),
    }));

  const specimen = `Specimen CS-${(parseInt(genomeHash(genome), 36) % 10000)
    .toString()
    .padStart(4, '0')}`;

  return { ...composeName(genome), specimen, periodChip, dietChip, lengthMeters, weightKg, stats, composition };
}

function clampStat(v: number): number {
  return Math.round(Math.min(100, Math.max(1, v)));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
