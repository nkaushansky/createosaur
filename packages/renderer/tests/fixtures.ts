import { GENOME_VERSION, type Genome } from '@createosaur/genome';
import type { SpeciesId } from '@createosaur/species-data';

/**
 * The golden-genome fixture set (ARCHITECTURE: testing strategy). Covers pure
 * species, mixes, every part-slot pin, ages, size extremes, patterns, and
 * sibling seeds. Renders of these must never change unintentionally.
 */
const base = {
  v: GENOME_VERSION,
  parts: {},
  cosmetics: { hide: '#6b8f4e', markings: '#d9a441', pattern: 'solid' as const },
  size: 55,
  age: 'adult' as const,
  seed: 1,
};

/** A neutral 50/50 two-species mix — the pairwise-breakage fixtures. */
function mix(a: SpeciesId, b: SpeciesId): Genome {
  return {
    ...base,
    dna: [
      { species: a, share: 50 },
      { species: b, share: 50 },
    ],
  };
}

export const FIXTURES: Record<string, Genome> = {
  'pure-tyrannosaurus': {
    ...base,
    dna: [{ species: 'tyrannosaurus', share: 100 }],
  },
  'pure-triceratops': {
    ...base,
    dna: [{ species: 'triceratops', share: 100 }],
  },
  'pure-stegosaurus': {
    ...base,
    dna: [{ species: 'stegosaurus', share: 100 }],
  },
  'duo-tyrannoceratops-60-40': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 60 },
      { species: 'triceratops', share: 40 },
    ],
  },
  'duo-stegorex-55-45': {
    ...base,
    dna: [
      { species: 'stegosaurus', share: 55 },
      { species: 'tyrannosaurus', share: 45 },
    ],
  },
  'trio-equal': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 34 },
      { species: 'triceratops', share: 33 },
      { species: 'stegosaurus', share: 33 },
    ],
  },
  'trio-rex-dominant': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 50 },
      { species: 'triceratops', share: 25 },
      { species: 'stegosaurus', share: 25 },
    ],
  },
  'pin-head-triceratops-on-rex': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 100 },
      { species: 'triceratops', share: 0 },
    ],
    parts: { head: 'triceratops' },
  },
  'pin-tail-stego-on-rex': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 100 },
      { species: 'stegosaurus', share: 0 },
    ],
    parts: { tail: 'stegosaurus' },
  },
  'pin-back-stego-stance-rex-on-trike': {
    ...base,
    dna: [
      { species: 'triceratops', share: 100 },
      { species: 'stegosaurus', share: 0 },
      { species: 'tyrannosaurus', share: 0 },
    ],
    parts: { back: 'stegosaurus', stance: 'tyrannosaurus' },
  },
  'hatchling-trio': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 34 },
      { species: 'triceratops', share: 33 },
      { species: 'stegosaurus', share: 33 },
    ],
    age: 'hatchling',
  },
  'juvenile-triceratops': {
    ...base,
    dna: [{ species: 'triceratops', share: 100 }],
    age: 'juvenile',
  },
  'size-min-rex': {
    ...base,
    dna: [{ species: 'tyrannosaurus', share: 100 }],
    size: 0,
  },
  'size-max-stego': {
    ...base,
    dna: [{ species: 'stegosaurus', share: 100 }],
    size: 100,
  },
  'pattern-stripes-duo': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 50 },
      { species: 'stegosaurus', share: 50 },
    ],
    cosmetics: { hide: '#8f6a4e', markings: '#5c88b5', pattern: 'stripes' },
  },
  'pattern-spots-seed9': {
    ...base,
    dna: [
      { species: 'triceratops', share: 70 },
      { species: 'tyrannosaurus', share: 30 },
    ],
    cosmetics: { hide: '#4e7a8f', markings: '#c9564a', pattern: 'spots' },
    seed: 9,
  },
  'pattern-rings': {
    ...base,
    dna: [{ species: 'stegosaurus', share: 100 }],
    cosmetics: { hide: '#7d8f4e', markings: '#c96f3a', pattern: 'rings' },
  },
  'pattern-countershade': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 65 },
      { species: 'triceratops', share: 35 },
    ],
    cosmetics: { hide: '#5d6f7a', markings: '#d9a441', pattern: 'countershade' },
  },
  'sibling-seed-2': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 40 },
      { species: 'triceratops', share: 35 },
      { species: 'stegosaurus', share: 25 },
    ],
    seed: 2,
  },
  'sibling-seed-3': {
    ...base,
    dna: [
      { species: 'tyrannosaurus', share: 40 },
      { species: 'triceratops', share: 35 },
      { species: 'stegosaurus', share: 25 },
    ],
    seed: 3,
  },

  // M1 Wave 2 — archetype exemplars
  'pure-brachiosaurus': {
    ...base,
    dna: [{ species: 'brachiosaurus', share: 100 }],
    cosmetics: { hide: '#7f8a63', markings: '#b7a06a', pattern: 'countershade' },
  },
  'pure-parasaurolophus': {
    ...base,
    dna: [{ species: 'parasaurolophus', share: 100 }],
    cosmetics: { hide: '#b5793f', markings: '#57708a', pattern: 'stripes' },
  },
  // locks the fit-to-frame clamp: a full-height sauropod at max size stays in
  // frame (its head would otherwise scale off the top of the viewBox)
  'brachiosaurus-size-max': {
    ...base,
    dna: [{ species: 'brachiosaurus', share: 100 }],
    size: 100,
  },

  // M1 Wave 3 — armored / sail / feathered / dome-skulled roster
  'pure-ankylosaurus': {
    ...base,
    dna: [{ species: 'ankylosaurus', share: 100 }],
    cosmetics: { hide: '#7c7666', markings: '#55503f', pattern: 'countershade' },
  },
  'pure-spinosaurus': {
    ...base,
    dna: [{ species: 'spinosaurus', share: 100 }],
    cosmetics: { hide: '#4a7f8f', markings: '#c25a4a', pattern: 'countershade' },
  },
  'pure-velociraptor': {
    ...base,
    dna: [{ species: 'velociraptor', share: 100 }],
    cosmetics: { hide: '#a5763f', markings: '#4f3b28', pattern: 'solid' },
  },
  'pure-dracorex': {
    ...base,
    dna: [{ species: 'dracorex', share: 100 }],
    cosmetics: { hide: '#8a6a7a', markings: '#c0a44a', pattern: 'solid' },
  },

  // M1 Wave 5 — every pairwise 50/50 mix of the five archetype exemplars
  // (theropod=rex, ceratopsian=trike, armored=stego, sauropod=brachio,
  // ornithopod=para) must render without anatomical breakage. Plus the wild
  // callouts: ankylosaur×ornithopod and extra sauropod×theropod / feathers.
  'mix-rex-triceratops': mix('tyrannosaurus', 'triceratops'),
  'mix-rex-stegosaurus': mix('tyrannosaurus', 'stegosaurus'),
  'mix-rex-brachiosaurus': mix('tyrannosaurus', 'brachiosaurus'),
  'mix-rex-parasaurolophus': mix('tyrannosaurus', 'parasaurolophus'),
  'mix-triceratops-stegosaurus': mix('triceratops', 'stegosaurus'),
  'mix-triceratops-brachiosaurus': mix('triceratops', 'brachiosaurus'),
  'mix-triceratops-parasaurolophus': mix('triceratops', 'parasaurolophus'),
  'mix-stegosaurus-brachiosaurus': mix('stegosaurus', 'brachiosaurus'),
  'mix-stegosaurus-parasaurolophus': mix('stegosaurus', 'parasaurolophus'),
  'mix-brachiosaurus-parasaurolophus': mix('brachiosaurus', 'parasaurolophus'),
  // wild: ankylosaur club × ornithopod crest
  'mix-ankylosaurus-parasaurolophus': mix('ankylosaurus', 'parasaurolophus'),
  // wild: sail theropod × sauropod, and feathered × frilled
  'mix-spinosaurus-brachiosaurus': mix('spinosaurus', 'brachiosaurus'),
  'mix-velociraptor-triceratops': mix('velociraptor', 'triceratops'),
};
