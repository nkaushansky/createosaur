import { describe, expect, it } from 'vitest';
import { PART_SLOTS, SPECIES_IDS } from '@createosaur/species-data';
import { renderPart } from '../src/index';

/**
 * Part-vignette goldens (GAME-DESIGN §4.2): a picker thumbnail is `renderPart`
 * cropped to one slot. It is the same pure renderer as the full creature, so
 * the determinism contract applies here too — every species × slot vignette is
 * snapshot-locked. Regenerate only in a dedicated commit with screenshots and
 * a stated reason, exactly like the creature goldens.
 */
describe('part vignette goldens', () => {
  for (const species of SPECIES_IDS) {
    for (const slot of PART_SLOTS) {
      it(`renders ${species}/${slot} identically`, async () => {
        const svg = renderPart(species, slot);
        await expect(svg).toMatchFileSnapshot(`__goldens__/part-${species}-${slot}.svg`);
      });
    }
  }
});

describe('part vignette determinism & purity', () => {
  it('is deterministic across repeated calls', () => {
    for (const species of SPECIES_IDS) {
      for (const slot of PART_SLOTS) {
        expect(renderPart(species, slot)).toBe(renderPart(species, slot));
      }
    }
  });

  it('produces a valid, self-contained cropped SVG per slot', () => {
    for (const species of SPECIES_IDS) {
      for (const slot of PART_SLOTS) {
        const svg = renderPart(species, slot);
        // a tight crop, not the full 820×540 creature frame
        expect(svg).toMatch(/^<svg [^>]*viewBox="[-\d. ]+"/);
        expect(svg).not.toContain('viewBox="0 0 820 540"');
        expect(svg).toContain('</svg>');
        // no ground line in a vignette
        expect(svg).not.toContain(`y1="470"`);
      }
    }
  });
});
