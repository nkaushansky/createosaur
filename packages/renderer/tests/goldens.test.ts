import { describe, expect, it } from 'vitest';
import { renderCreature } from '../src/index';
import { FIXTURES } from './fixtures';

/**
 * THE determinism invariant (CLAUDE.md): same genome → identical SVG.
 * These snapshots are the contract. Regenerating them is allowed only in a
 * dedicated commit with before/after screenshots and a stated reason —
 * never as a side effect of "making tests pass".
 */
describe('golden genomes', () => {
  for (const [name, genome] of Object.entries(FIXTURES)) {
    it(`renders ${name} identically`, async () => {
      const svg = renderCreature(genome, { idSuffix: name });
      await expect(svg).toMatchFileSnapshot(`__goldens__/${name}.svg`);
    });
  }
});
