import { describe, expect, it } from 'vitest';
import { defaultGenome, isValidGenome, parseGenome } from '../src/index';

/**
 * genomeSchema is the trust boundary for untrusted input (share URLs, M2
 * request bodies). These tests exist because the adversarial review proved
 * a crafted genome ({species: "constructor"}) previously passed validation
 * and crashed the renderer.
 */
describe('genome schema boundary', () => {
  it('accepts the default genome', () => {
    expect(isValidGenome(defaultGenome())).toBe(true);
  });

  it('accepts a genome without parts (defaults to {})', () => {
    const { parts: _drop, ...rest } = defaultGenome();
    const parsed = parseGenome(JSON.parse(JSON.stringify(rest)));
    expect(parsed.parts).toEqual({});
  });

  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'])(
    'rejects prototype-chain species id %s',
    (evil) => {
      const g = { ...defaultGenome(), dna: [{ species: evil, share: 100 }] };
      expect(isValidGenome(JSON.parse(JSON.stringify(g)))).toBe(false);
    }
  );

  it('rejects unknown species ids', () => {
    const g = { ...defaultGenome(), dna: [{ species: 'mosasaurus', share: 100 }] };
    expect(isValidGenome(g)).toBe(false);
  });

  it('rejects duplicate species in the pool', () => {
    const g = {
      ...defaultGenome(),
      dna: [
        { species: 'tyrannosaurus', share: 50 },
        { species: 'tyrannosaurus', share: 50 },
      ],
    };
    expect(isValidGenome(g)).toBe(false);
  });

  it('rejects pools above the cap and empty pools', () => {
    const five = Array.from({ length: 5 }, () => ({ species: 'tyrannosaurus', share: 20 }));
    expect(isValidGenome({ ...defaultGenome(), dna: five })).toBe(false);
    expect(isValidGenome({ ...defaultGenome(), dna: [] })).toBe(false);
  });

  it('rejects pins to species outside the pool', () => {
    const g = {
      ...defaultGenome(),
      dna: [{ species: 'tyrannosaurus', share: 100 }],
      parts: { head: 'triceratops' },
    };
    expect(isValidGenome(g)).toBe(false);
  });

  it('rejects out-of-range and non-finite shares', () => {
    for (const share of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY]) {
      const g = { ...defaultGenome(), dna: [{ species: 'tyrannosaurus', share }] };
      expect(isValidGenome(g)).toBe(false);
    }
  });

  it('rejects malformed colors and normalizes case', () => {
    const bad = { ...defaultGenome(), cosmetics: { hide: 'red', markings: '#fff', pattern: 'solid' } };
    expect(isValidGenome(bad)).toBe(false);
    const upper = {
      ...defaultGenome(),
      cosmetics: { hide: '#6B8F4E', markings: '#D9A441', pattern: 'solid' as const },
    };
    expect(parseGenome(upper).cosmetics.hide).toBe('#6b8f4e');
  });

  it('rejects unknown schema versions', () => {
    expect(isValidGenome({ ...defaultGenome(), v: 2 })).toBe(false);
  });

  it('rejects non-integer or negative seeds', () => {
    expect(isValidGenome({ ...defaultGenome(), seed: 1.5 })).toBe(false);
    expect(isValidGenome({ ...defaultGenome(), seed: -1 })).toBe(false);
  });
});
