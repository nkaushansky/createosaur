import type { SpeciesDef } from './types';

/**
 * The M0 roster: the three archetype exemplars validated in the Morph Lab
 * prototype (docs/rebuild/prototype/morphlab.html). Morph vectors are the
 * prototype's tuned values, verbatim — they are known-good geometry.
 *
 * Facts are salvaged from legacy/src/data/dinosaurDatabase.ts (the single
 * source of paleontology truth). M1 expands this file wave by wave.
 */
export const SPECIES = {
  tyrannosaurus: {
    id: 'tyrannosaurus',
    name: 'Tyrannosaurus Rex',
    archetype: 'theropod',
    inV1: true,
    facts: {
      scientificName: 'Tyrannosaurus rex',
      period: 'Late Cretaceous',
      era: 'Mesozoic',
      diet: 'Carnivore',
      habitat: 'Forests and plains',
      description: 'The king of dinosaurs, most famous apex predator of all time',
      lengthMeters: 12.3,
      weightKg: 8400,
      discoveryLocation: 'Montana, USA',
    },
    morph: {
      hipY: 285,
      shoulderRise: 20,
      bodyLen: 145,
      archUp: 15,
      neckLen: 75,
      neckUp: 55,
      snoutLen: 60,
      headSize: 52,
      snoutTip: 18,
      neckThick: 36,
      tailLen: 265,
      tailDrop: 50,
      tailThick: 48,
      bodyThick: 96,
      chestThick: 72,
      fLegLen: 60,
      fLegThick: 11,
      hLegThick: 42,
    },
    features: [{ kind: 'teeth', slot: 'head' }],
    syllables: { prefix: 'Tyranno', duo: 'rex', mid: 'rexo', suffix: 'rex' },
    stats: { attack: 92, defense: 28, speed: 74, brains: 58 },
    uiColor: '#b5482a',
  },

  triceratops: {
    id: 'triceratops',
    name: 'Triceratops',
    archetype: 'ceratopsian',
    inV1: true,
    facts: {
      scientificName: 'Triceratops horridus',
      period: 'Late Cretaceous',
      era: 'Mesozoic',
      diet: 'Herbivore',
      habitat: 'Plains and woodlands',
      description: 'Three-horned herbivore that could defend itself against T-Rex',
      lengthMeters: 9,
      weightKg: 12000,
      discoveryLocation: 'North America',
    },
    morph: {
      hipY: 320,
      shoulderRise: -8,
      bodyLen: 140,
      archUp: 6,
      neckLen: 50,
      neckUp: 6,
      snoutLen: 48,
      headSize: 44,
      snoutTip: 8,
      neckThick: 46,
      tailLen: 190,
      tailDrop: 78,
      tailThick: 40,
      bodyThick: 100,
      chestThick: 86,
      fLegLen: 150,
      fLegThick: 26,
      hLegThick: 36,
    },
    features: [
      { kind: 'browHorns', slot: 'head' },
      { kind: 'noseHorn', slot: 'head' },
      { kind: 'frill', slot: 'head' },
    ],
    syllables: { prefix: 'Tricera', duo: 'ceratops', mid: 'cerato', suffix: 'tops' },
    stats: { attack: 34, defense: 88, speed: 38, brains: 42 },
    uiColor: '#4f5fb0',
  },

  stegosaurus: {
    id: 'stegosaurus',
    name: 'Stegosaurus',
    archetype: 'armored',
    inV1: true,
    facts: {
      scientificName: 'Stegosaurus stenops',
      period: 'Late Jurassic',
      era: 'Mesozoic',
      diet: 'Herbivore',
      habitat: 'Fern prairies',
      description: 'Iconic plated dinosaur with defensive tail spikes',
      lengthMeters: 9,
      weightKg: 5000,
      discoveryLocation: 'Colorado, USA',
    },
    morph: {
      hipY: 310,
      shoulderRise: -30,
      bodyLen: 140,
      archUp: 42,
      neckLen: 60,
      neckUp: -18,
      snoutLen: 32,
      headSize: 26,
      snoutTip: 7,
      neckThick: 26,
      tailLen: 235,
      tailDrop: 105,
      tailThick: 40,
      bodyThick: 104,
      chestThick: 70,
      fLegLen: 132,
      fLegThick: 21,
      hLegThick: 34,
    },
    features: [
      { kind: 'plates', slot: 'back' },
      { kind: 'tailSpikes', slot: 'tail' },
    ],
    syllables: { prefix: 'Stego', duo: 'stega', mid: 'stego', suffix: 'saurus' },
    stats: { attack: 26, defense: 84, speed: 20, brains: 14 },
    uiColor: '#1f7d6d',
  },
} as const satisfies Record<string, SpeciesDef>;

export type SpeciesId = keyof typeof SPECIES;

export const SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];

export function getSpecies(id: SpeciesId): SpeciesDef {
  return SPECIES[id];
}

export function isSpeciesId(id: string): id is SpeciesId {
  // Object.hasOwn, not `in`: untrusted ids like "constructor" must not
  // validate via the prototype chain (this is the share-URL trust boundary).
  return Object.hasOwn(SPECIES, id);
}
