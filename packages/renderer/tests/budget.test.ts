import { describe, expect, it } from 'vitest';
import { renderCreature } from '../src/index';
import { FIXTURES } from './fixtures';

/**
 * STYLE-BIBLE §2 Chromebook budget: ≤ 300 SVG elements / ≤ 40 KB at
 * detail:'full', ≤ 180 elements at 'fast', and no SVG <filter> anywhere the
 * slider re-renders per tick — soft shading is built from gradients only.
 */
const elements = (svg: string): number => (svg.match(/</g) ?? []).length;

describe('render budget', () => {
  for (const [name, genome] of Object.entries(FIXTURES)) {
    it(`${name} stays inside the budget`, () => {
      const full = renderCreature(genome, { idSuffix: 'b' });
      expect(elements(full)).toBeLessThanOrEqual(300);
      expect(Buffer.byteLength(full, 'utf8')).toBeLessThanOrEqual(40 * 1024);
      expect(full).not.toContain('<filter');

      const fast = renderCreature(genome, { idSuffix: 'b', detail: 'fast' });
      expect(elements(fast)).toBeLessThanOrEqual(180);
      expect(fast).not.toContain('<filter');
    });
  }
});
