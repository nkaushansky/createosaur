import { describe, expect, it } from 'vitest';
import { composeName, defaultGenome, type Genome } from '../src/index';

function genome(overrides: Partial<Genome> = {}): Genome {
  return { ...defaultGenome(), ...overrides };
}

describe('composeName', () => {
  it('keeps the real name for pure creatures', () => {
    expect(composeName(genome()).name).toBe('Tyrannosaurus Rex');
  });

  it('composes prefix+duo for two-species mixes', () => {
    const g = genome({
      dna: [
        { species: 'stegosaurus', share: 55 },
        { species: 'tyrannosaurus', share: 45 },
      ],
    });
    expect(composeName(g).name).toBe('Stegorex');
  });

  it('composes prefix+mid+suffix for three-way mixes', () => {
    const g = genome({
      dna: [
        { species: 'tyrannosaurus', share: 40 },
        { species: 'triceratops', share: 35 },
        { species: 'stegosaurus', share: 25 },
      ],
    });
    expect(composeName(g).name).toBe('Tyrannoceratosaurus');
  });

  it('lets pins shift the name (D-014): Trike head on a pure T-Rex', () => {
    const g = genome({
      dna: [
        { species: 'tyrannosaurus', share: 100 },
        { species: 'triceratops', share: 0 },
      ],
      parts: { head: 'triceratops' },
    });
    expect(composeName(g).name).toBe('Tyrannoceratops');
  });

  it('ignores trace third species below the threshold', () => {
    const g = genome({
      dna: [
        { species: 'tyrannosaurus', share: 60 },
        { species: 'triceratops', share: 38 },
        { species: 'stegosaurus', share: 2 },
      ],
    });
    expect(composeName(g).name).toBe('Tyrannoceratops');
  });
});
