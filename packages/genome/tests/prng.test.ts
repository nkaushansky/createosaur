import { describe, expect, it } from 'vitest';
import { genomeHash, hashString, mulberry32, stableStringify } from '../src/index';

describe('stableStringify', () => {
  it('is insensitive to key order', () => {
    expect(stableStringify({ a: 1, b: [2, { c: 3 }] })).toBe(
      stableStringify({ b: [2, { c: 3 }], a: 1 })
    );
  });

  it('omits keys with undefined values, matching JSON semantics', () => {
    // {parts:{head:undefined}} and {parts:{}} render identically and JSON
    // round-trip identically — their hashes must agree (review finding)
    expect(stableStringify({ parts: { head: undefined } })).toBe(
      stableStringify({ parts: {} })
    );
    expect(genomeHash({ parts: { head: undefined } })).toBe(genomeHash({ parts: {} }));
  });

  it('serializes undefined array elements as null, matching JSON', () => {
    expect(stableStringify([1, undefined, 3])).toBe('[1,null,3]');
  });

  it('produces valid JSON', () => {
    const s = stableStringify({ z: 1, a: { y: [true, null, 'x'] } });
    expect(() => JSON.parse(s)).not.toThrow();
  });
});

describe('deterministic primitives', () => {
  it('mulberry32 yields an identical sequence per seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    expect(mulberry32(43)()).not.toBe(mulberry32(42)());
  });

  it('hashString is stable and discriminates', () => {
    expect(hashString('createosaur')).toBe(hashString('createosaur'));
    expect(hashString('createosaur')).not.toBe(hashString('createosaus'));
  });
});
