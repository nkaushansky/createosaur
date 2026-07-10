/**
 * Deterministic PRNG utilities. The renderer and blend math must never call
 * Math.random or Date.now — all variation derives from genome.seed so that
 * the same genome renders identically everywhere, forever.
 */

/** mulberry32 — small, fast, good-enough distribution for visual jitter. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic 32-bit hash of a string (FNV-1a). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Stable stringify: object keys sorted so hashing a genome is insensitive to
 * property insertion order.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    // match JSON semantics: undefined array elements serialize as null
    return `[${value.map((v) => (v === undefined ? 'null' : stableStringify(v))).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  // match JSON semantics: keys with undefined values are omitted, so
  // {parts:{head:undefined}} and {parts:{}} hash identically (they render
  // identically and JSON round-trip identically — the hash must agree)
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/** Short, deterministic identity hash for a genome (specimen numbers, DOM ids). */
export function genomeHash(genome: unknown): string {
  return hashString(stableStringify(genome)).toString(36);
}
