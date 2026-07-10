import { describe, expect, it } from 'vitest';
import {
  MORPH_KEYS,
  PART_SLOTS,
  SPECIES,
  SPECIES_IDS,
  type SpeciesId,
} from '../src/index';

/**
 * Data-integrity guardrails for the species table. M1 expands this file
 * wave by wave, often via the authoring workbench — these checks catch a
 * half-authored species before it ships broken geometry or naming.
 */
const ARCHETYPES = [
  'theropod',
  'ceratopsian',
  'armored',
  'sauropod',
  'ornithopod',
  'marine',
  'flyer',
];

describe.each(SPECIES_IDS)('species %s', (id: SpeciesId) => {
  const sp = SPECIES[id];

  it('id matches its table key', () => {
    expect(sp.id).toBe(id);
  });

  it('has every morph parameter, finite', () => {
    for (const key of MORPH_KEYS) {
      expect(Number.isFinite(sp.morph[key]), `morph.${key}`).toBe(true);
    }
  });

  it('has complete naming syllables', () => {
    for (const part of ['prefix', 'duo', 'mid', 'suffix'] as const) {
      expect(sp.syllables[part].length, `syllables.${part}`).toBeGreaterThan(0);
    }
  });

  it('has stats in 0..100', () => {
    for (const [k, v] of Object.entries(sp.stats)) {
      expect(v, `stats.${k}`).toBeGreaterThanOrEqual(0);
      expect(v, `stats.${k}`).toBeLessThanOrEqual(100);
    }
  });

  it('has a valid archetype and UI color', () => {
    expect(ARCHETYPES).toContain(sp.archetype);
    expect(sp.uiColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('feature genes reference real slots', () => {
    for (const f of sp.features) {
      expect(PART_SLOTS).toContain(f.slot);
    }
  });

  it('has honest facts fields', () => {
    expect(sp.facts.lengthMeters).toBeGreaterThan(0);
    expect(sp.facts.weightKg).toBeGreaterThan(0);
    expect(sp.facts.scientificName.length).toBeGreaterThan(0);
    expect(sp.facts.period.length).toBeGreaterThan(0);
  });
});
