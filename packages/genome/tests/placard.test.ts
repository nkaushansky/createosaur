import { describe, expect, it } from 'vitest';
import { defaultGenome, derivePlacard, type Genome } from '../src/index';

function genome(overrides: Partial<Genome> = {}): Genome {
  return { ...defaultGenome(), ...overrides };
}

const trio = (): Genome =>
  genome({
    dna: [
      { species: 'tyrannosaurus', share: 34 },
      { species: 'triceratops', share: 33 },
      { species: 'stegosaurus', share: 33 },
    ],
  });

describe('derivePlacard', () => {
  it('shows real facts for a pure species', () => {
    const p = derivePlacard(genome()); // pure T-Rex, size 55, adult
    expect(p.name).toBe('Tyrannosaurus Rex');
    expect(p.periodChip).toBe('Late Cretaceous');
    expect(p.dietChip).toBe('Carnivore');
    // 12.3 m × (0.6 + 55/100 × 0.8) = 12.792 → 12.8
    expect(p.lengthMeters).toBeCloseTo(12.8, 1);
    expect(p.weightKg).toBe(Math.round(8400 * 1.04));
  });

  it('mixed eras earn the epoch joke; mixed diets the omnivore joke', () => {
    const p = derivePlacard(trio());
    expect(p.periodChip).toBe('Epoch: impossible');
    expect(p.dietChip).toBe('Omnivore (allegedly)');
  });

  it('pure herbivores read Herbivore', () => {
    expect(
      derivePlacard(genome({ dna: [{ species: 'triceratops', share: 100 }] })).dietChip
    ).toBe('Herbivore');
  });

  it('hatchlings weigh a fraction of adults', () => {
    const adult = derivePlacard(genome());
    const hatchling = derivePlacard(genome({ age: 'hatchling' }));
    expect(hatchling.weightKg).toBe(Math.round(adult.weightKg * 0.15));
    // and lose most of their menace
    expect(hatchling.stats.attack).toBeLessThan(adult.stats.attack / 2);
  });

  it('stats stay in 1..100 at the extremes', () => {
    for (const size of [0, 100]) {
      const p = derivePlacard(genome({ size }));
      for (const v of Object.values(p.stats)) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it('specimen number is stable per genome and moves with the seed', () => {
    expect(derivePlacard(genome()).specimen).toBe(derivePlacard(genome()).specimen);
    expect(derivePlacard(genome({ seed: 2 })).specimen).not.toBe(
      derivePlacard(genome()).specimen
    );
  });

  it('composition hides trace species below 5%', () => {
    const p = derivePlacard(
      genome({
        dna: [
          { species: 'tyrannosaurus', share: 97 },
          { species: 'triceratops', share: 3 },
        ],
      })
    );
    expect(p.composition.map((c) => c.species)).toEqual(['tyrannosaurus']);
  });
});
