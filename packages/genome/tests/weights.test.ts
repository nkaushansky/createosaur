import { describe, expect, it } from 'vitest';
import {
  defaultGenome,
  identityWeights,
  normalizedShares,
  slotWeights,
  type Genome,
} from '../src/index';

function genome(overrides: Partial<Genome> = {}): Genome {
  return { ...defaultGenome(), ...overrides };
}

describe('normalizedShares', () => {
  it('normalizes shares to sum 1', () => {
    const g = genome({
      dna: [
        { species: 'tyrannosaurus', share: 50 },
        { species: 'triceratops', share: 25 },
        { species: 'stegosaurus', share: 25 },
      ],
    });
    const w = normalizedShares(g);
    expect(w.tyrannosaurus).toBeCloseTo(0.5);
    expect(w.triceratops).toBeCloseTo(0.25);
    expect(w.stegosaurus).toBeCloseTo(0.25);
  });

  it('treats all-zero sliders as an equal blend — no null creature', () => {
    const g = genome({
      dna: [
        { species: 'tyrannosaurus', share: 0 },
        { species: 'triceratops', share: 0 },
      ],
    });
    const w = normalizedShares(g);
    expect(w.tyrannosaurus).toBeCloseTo(0.5);
    expect(w.triceratops).toBeCloseTo(0.5);
  });
});

describe('slotWeights', () => {
  it('is one-hot for a pinned slot regardless of shares', () => {
    const g = genome({ parts: { head: 'triceratops' } });
    const w = slotWeights(g, 'head');
    expect(w.triceratops).toBe(1);
    expect(w.tyrannosaurus).toBe(0);
  });

  it('falls back to DNA shares for unpinned slots', () => {
    const g = genome({ parts: { head: 'triceratops' } });
    const w = slotWeights(g, 'tail');
    expect(w.tyrannosaurus).toBeCloseTo(1);
  });
});

describe('identityWeights', () => {
  it('equals shares when nothing is pinned', () => {
    const g = genome();
    expect(identityWeights(g).tyrannosaurus).toBeCloseTo(1);
  });

  it('shifts identity when a part is pinned (D-014)', () => {
    const g = genome({ parts: { head: 'triceratops' } });
    const w = identityWeights(g);
    // one of five slots is fully triceratops
    expect(w.triceratops).toBeCloseTo(0.2);
    expect(w.tyrannosaurus).toBeCloseTo(0.8);
  });
});
