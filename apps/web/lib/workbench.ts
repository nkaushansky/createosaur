import {
  getSpecies,
  MORPH_KEYS,
  type Archetype,
  type Diet,
  type FeatureKind,
  type MorphVector,
  type PartSlot,
  type SpeciesDef,
  type SpeciesId,
} from '@createosaur/species-data';

/**
 * Authoring metadata for the dev species workbench. None of this ships in the
 * product; it exists so morph vectors can be tuned by eye and exported in the
 * exact shape of a `packages/species-data` entry (ARCHITECTURE §species data
 * pipeline).
 */

export interface MorphRange {
  label: string;
  min: number;
  max: number;
  step: number;
}

/**
 * Slider bounds per morph parameter, grouped by the slot that owns it
 * (GAME-DESIGN §3.1). Ranges are deliberately wide enough for M1's new body
 * plans — a sauropod's neck/legs and a raptor's light build push well past the
 * M0 trio — while staying inside anatomically sane limits.
 */
export const MORPH_GROUPS: Array<{ slot: PartSlot; label: string; keys: Array<keyof MorphVector> }> = [
  { slot: 'stance', label: 'Stance & legs', keys: ['hipY', 'shoulderRise', 'fLegLen', 'fLegThick', 'hLegThick'] },
  { slot: 'back', label: 'Torso', keys: ['bodyLen', 'archUp', 'bodyThick', 'chestThick'] },
  { slot: 'head', label: 'Neck & head', keys: ['neckLen', 'neckUp', 'neckThick', 'headSize', 'snoutLen', 'snoutTip'] },
  { slot: 'tail', label: 'Tail', keys: ['tailLen', 'tailDrop', 'tailThick'] },
];

export const MORPH_RANGES: Record<keyof MorphVector, MorphRange> = {
  hipY: { label: 'Hip height (y, lower = taller)', min: 220, max: 380, step: 1 },
  shoulderRise: { label: 'Shoulder rise', min: -60, max: 120, step: 1 },
  fLegLen: { label: 'Front leg length', min: 30, max: 230, step: 1 },
  fLegThick: { label: 'Front leg thickness', min: 5, max: 55, step: 1 },
  hLegThick: { label: 'Hind leg thickness', min: 10, max: 80, step: 1 },
  bodyLen: { label: 'Body length', min: 80, max: 240, step: 1 },
  archUp: { label: 'Back arch', min: -15, max: 65, step: 1 },
  bodyThick: { label: 'Body thickness', min: 35, max: 160, step: 1 },
  chestThick: { label: 'Chest thickness', min: 25, max: 140, step: 1 },
  neckLen: { label: 'Neck length', min: 20, max: 280, step: 1 },
  neckUp: { label: 'Neck rise', min: -70, max: 260, step: 1 },
  neckThick: { label: 'Neck thickness', min: 8, max: 80, step: 1 },
  headSize: { label: 'Head size', min: 10, max: 74, step: 1 },
  snoutLen: { label: 'Snout length', min: 8, max: 95, step: 1 },
  snoutTip: { label: 'Snout tip width', min: 2, max: 42, step: 1 },
  tailLen: { label: 'Tail length', min: 50, max: 330, step: 1 },
  tailDrop: { label: 'Tail drop', min: -25, max: 170, step: 1 },
  tailThick: { label: 'Tail thickness', min: 6, max: 75, step: 1 },
};

/** The slot each feature gene expresses through (GAME-DESIGN §3.2). */
export const FEATURE_SLOT: Record<FeatureKind, PartSlot> = {
  teeth: 'head',
  browHorns: 'head',
  noseHorn: 'head',
  frill: 'head',
  crest: 'head',
  domeSkull: 'head',
  plates: 'back',
  sail: 'back',
  tailSpikes: 'tail',
  tailClub: 'tail',
  feathers: 'skin',
};

export const FEATURE_KINDS = Object.keys(FEATURE_SLOT) as FeatureKind[];

export const ARCHETYPES: Archetype[] = [
  'theropod',
  'ceratopsian',
  'armored',
  'sauropod',
  'ornithopod',
  'marine',
  'flyer',
];

export const DIETS: Diet[] = ['Carnivore', 'Herbivore', 'Omnivore', 'Piscivore', 'Insectivore'];

/** A blank, editable species — a neutral biped to tune from scratch. */
export function blankSpecies(): SpeciesDef {
  return {
    id: 'new_species',
    name: 'New Species',
    archetype: 'theropod',
    inV1: true,
    facts: {
      scientificName: '',
      period: 'Late Cretaceous',
      era: 'Mesozoic',
      diet: 'Herbivore',
      habitat: '',
      description: '',
      lengthMeters: 5,
      weightKg: 500,
      discoveryLocation: '',
    },
    morph: { ...getSpecies('tyrannosaurus').morph },
    features: [],
    syllables: { prefix: '', duo: '', mid: '', suffix: '' },
    stats: { attack: 40, defense: 40, speed: 40, brains: 40 },
    uiColor: '#6b7a4e',
  };
}

/** A deep, mutable copy of an existing species — the "load a base to tune" path. */
export function cloneSpecies(id: SpeciesId): SpeciesDef {
  return structuredClone(getSpecies(id)) as SpeciesDef;
}

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * Serialize a species to a source literal matching the hand-authored style of
 * `packages/species-data/src/species.ts`, keyed by id and ready to paste. This
 * is the workbench's deliverable: an authored vector in the exact committed
 * shape, so tuning never diverges from what ships.
 */
export function speciesToSource(sp: SpeciesDef): string {
  const morphLines = MORPH_KEYS.map((k) => `      ${k}: ${round(sp.morph[k])},`).join('\n');
  const featureLines = sp.features.length
    ? sp.features.map((f) => `{ kind: ${q(f.kind)}, slot: ${q(f.slot)} }`).join(', ')
    : '';
  return `  ${sp.id}: {
    id: ${q(sp.id)},
    name: ${q(sp.name)},
    archetype: ${q(sp.archetype)},
    inV1: ${sp.inV1},
    facts: {
      scientificName: ${q(sp.facts.scientificName)},
      period: ${q(sp.facts.period)},
      era: ${q(sp.facts.era)},
      diet: ${q(sp.facts.diet)},
      habitat: ${q(sp.facts.habitat)},
      description: ${q(sp.facts.description)},
      lengthMeters: ${sp.facts.lengthMeters},
      weightKg: ${sp.facts.weightKg},
      discoveryLocation: ${q(sp.facts.discoveryLocation)},
    },
    morph: {
${morphLines}
    },
    features: [${featureLines}],
    syllables: { prefix: ${q(sp.syllables.prefix)}, duo: ${q(sp.syllables.duo)}, mid: ${q(
      sp.syllables.mid
    )}, suffix: ${q(sp.syllables.suffix)} },
    stats: { attack: ${sp.stats.attack}, defense: ${sp.stats.defense}, speed: ${sp.stats.speed}, brains: ${sp.stats.brains} },
    uiColor: ${q(sp.uiColor)},
  },`;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
