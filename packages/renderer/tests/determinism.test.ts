import { describe, expect, it } from 'vitest';
import { parseGenome } from '@createosaur/genome';
import { renderCreature } from '../src/index';
import { FIXTURES } from './fixtures';

describe('determinism', () => {
  it('renders every fixture identically across repeated calls', () => {
    for (const genome of Object.values(FIXTURES)) {
      expect(renderCreature(genome)).toBe(renderCreature(structuredClone(genome)));
    }
  });

  it('survives a JSON round-trip (share-link simulation)', () => {
    for (const genome of Object.values(FIXTURES)) {
      const roundTripped = parseGenome(JSON.parse(JSON.stringify(genome)));
      expect(renderCreature(roundTripped)).toBe(renderCreature(genome));
    }
  });

  it('is insensitive to genome property order', () => {
    const g = FIXTURES['trio-equal']!;
    const reordered = parseGenome(
      JSON.parse(
        JSON.stringify({
          seed: g.seed,
          age: g.age,
          size: g.size,
          cosmetics: g.cosmetics,
          parts: g.parts,
          dna: g.dna,
          v: g.v,
        })
      )
    );
    // note: idSuffix defaults to a hash of the genome object — supply a fixed
    // one so this test isolates the geometry, not the hash of key order
    expect(renderCreature(reordered, { idSuffix: 'x' })).toBe(
      renderCreature(g, { idSuffix: 'x' })
    );
  });

  it('siblings (same DNA, different seed) differ but stay recognizable', () => {
    const a = renderCreature(FIXTURES['sibling-seed-2']!, { idSuffix: 'a' });
    const b = renderCreature(FIXTURES['sibling-seed-3']!, { idSuffix: 'a' });
    expect(a).not.toBe(b);
    // same structure: identical element counts, only coordinates move
    const shape = (s: string) => s.replace(/[\d.-]+/g, '#');
    expect(shape(a)).toBe(shape(b));
  });
});
