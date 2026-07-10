import { describe, expect, it } from 'vitest';
import { getSpecies, MORPH_KEYS } from '@createosaur/species-data';
import { blendGenome, defaultGenome, JITTER, type Genome } from '../src/index';

function genome(overrides: Partial<Genome> = {}): Genome {
  return { ...defaultGenome(), ...overrides };
}

describe('blendGenome', () => {
  it('is deterministic: same genome → identical result', () => {
    const g = genome({
      dna: [
        { species: 'tyrannosaurus', share: 40 },
        { species: 'triceratops', share: 35 },
        { species: 'stegosaurus', share: 25 },
      ],
      seed: 42,
    });
    expect(blendGenome(g)).toEqual(blendGenome(structuredClone(g)));
  });

  it('different seeds → siblings, not clones', () => {
    const a = blendGenome(genome({ seed: 1 }));
    const b = blendGenome(genome({ seed: 2 }));
    expect(a.morph).not.toEqual(b.morph);
    // but bounded: every param within jitter of the other
    for (const key of MORPH_KEYS) {
      const ratio = a.morph[key] / b.morph[key];
      expect(Math.abs(ratio - 1)).toBeLessThan(JITTER * 4 + 0.001);
    }
  });

  it('pure species stays within jitter of its authored vector', () => {
    const { morph } = blendGenome(genome({ seed: 7 }));
    const authored = getSpecies('tyrannosaurus').morph;
    for (const key of MORPH_KEYS) {
      expect(Math.abs(morph[key] / authored[key] - 1)).toBeLessThanOrEqual(JITTER + 1e-9);
    }
  });

  it('any convex mix stays within the pool species param envelope (+jitter)', () => {
    const g = genome({
      dna: [
        { species: 'tyrannosaurus', share: 33 },
        { species: 'triceratops', share: 33 },
        { species: 'stegosaurus', share: 34 },
      ],
      seed: 3,
    });
    const { morph } = blendGenome(g);
    for (const key of MORPH_KEYS) {
      const values = (['tyrannosaurus', 'triceratops', 'stegosaurus'] as const).map(
        (id) => getSpecies(id).morph[key]
      );
      const lo = Math.min(...values);
      const hi = Math.max(...values);
      const pad = Math.max(Math.abs(lo), Math.abs(hi)) * JITTER + 1e-9;
      expect(morph[key]).toBeGreaterThanOrEqual(Math.min(lo - pad, lo + pad));
      expect(morph[key]).toBeLessThanOrEqual(hi + pad);
    }
  });

  it('features stay off below the ramp and saturate above it', () => {
    const below = blendGenome(
      genome({
        dna: [
          { species: 'tyrannosaurus', share: 90 },
          { species: 'triceratops', share: 10 },
        ],
      })
    );
    expect(below.features.browHorns).toBeUndefined();

    const above = blendGenome(
      genome({
        dna: [
          { species: 'tyrannosaurus', share: 40 },
          { species: 'triceratops', share: 60 },
        ],
      })
    );
    expect(above.features.browHorns?.intensity).toBe(1);
  });

  it('a pinned head expresses head features at full intensity even at 0% DNA', () => {
    const g = genome({
      dna: [
        { species: 'tyrannosaurus', share: 100 },
        { species: 'triceratops', share: 0 },
      ],
      parts: { head: 'triceratops' },
    });
    const { features } = blendGenome(g);
    expect(features.frill?.intensity).toBe(1);
    expect(features.browHorns?.carrier).toBe('triceratops');
    // and the T-Rex teeth vanish — the head is fully triceratops
    expect(features.teeth).toBeUndefined();
  });

  it('hatchlings get proportionally bigger heads and shorter tails', () => {
    const adult = blendGenome(genome({ age: 'adult', seed: 5 }));
    const hatchling = blendGenome(genome({ age: 'hatchling', seed: 5 }));
    expect(hatchling.morph.headSize).toBeGreaterThan(adult.morph.headSize * 1.3);
    expect(hatchling.morph.tailLen).toBeLessThan(adult.morph.tailLen * 0.8);
    expect(hatchling.displayScale).toBeLessThan(adult.displayScale);
  });
});
