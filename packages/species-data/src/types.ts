/**
 * Foundational types for the species layer. This package is the bottom of the
 * dependency stack (genome and renderer both import from it), so shared
 * vocabulary lives here.
 */

/** Part slots a species can be pinned to (GAME-DESIGN §2). */
export type PartSlot = 'head' | 'back' | 'tail' | 'stance' | 'skin';

export const PART_SLOTS: readonly PartSlot[] = ['head', 'back', 'tail', 'stance', 'skin'];

/**
 * The shared morphospace (GAME-DESIGN §3.1). Every species is a point in this
 * space; blending is a weighted average, so every parameter must be
 * anatomically meaningful for every species.
 *
 * Coordinate space (inherited from the validated prototype): SVG viewBox
 * 820×540, ground line at y=470, hip anchored at x=505, creature faces left.
 * Lengths and thicknesses are in viewBox units.
 */
export interface MorphVector {
  /** y of the hip joint — lower value = taller stance */
  hipY: number;
  /** how far the shoulder sits above (+) or below (−) the hip */
  shoulderRise: number;
  /** hip → shoulder distance */
  bodyLen: number;
  /** upward bow of the mid-spine (Stegosaurus arch) */
  archUp: number;
  neckLen: number;
  /** head rise above (+) or drop below (−) the shoulder */
  neckUp: number;
  snoutLen: number;
  headSize: number;
  /** silhouette width at the snout tip (beaks are narrow) */
  snoutTip: number;
  neckThick: number;
  tailLen: number;
  /** tail tip drop below the hip line */
  tailDrop: number;
  tailThick: number;
  bodyThick: number;
  chestThick: number;
  fLegLen: number;
  fLegThick: number;
  hLegThick: number;
}

export const MORPH_KEYS = [
  'hipY',
  'shoulderRise',
  'bodyLen',
  'archUp',
  'neckLen',
  'neckUp',
  'snoutLen',
  'headSize',
  'snoutTip',
  'neckThick',
  'tailLen',
  'tailDrop',
  'tailThick',
  'bodyThick',
  'chestThick',
  'fLegLen',
  'fLegThick',
  'hLegThick',
] as const satisfies readonly (keyof MorphVector)[];

/**
 * Which part slot owns each morph parameter. A pinned slot swaps in the
 * pinned species' values for exactly these keys (GAME-DESIGN §3.1 table).
 * The `skin` slot owns no morph parameters yet — it governs integument
 * rendering from M1 onward.
 */
export const SLOT_PARAMS: Record<Exclude<PartSlot, 'skin'>, readonly (keyof MorphVector)[]> = {
  head: ['neckLen', 'neckUp', 'snoutLen', 'headSize', 'snoutTip', 'neckThick'],
  back: ['archUp', 'bodyThick', 'chestThick', 'bodyLen'],
  tail: ['tailLen', 'tailDrop', 'tailThick'],
  stance: ['hipY', 'shoulderRise', 'fLegLen', 'fLegThick', 'hLegThick'],
};

/**
 * Discrete anatomy that must not be continuously averaged (GAME-DESIGN §3.2).
 * A species *carries* features; expression intensity is computed from the
 * carrier's effective weight in the feature's slot via a threshold ramp.
 */
export type FeatureKind =
  | 'teeth'
  | 'browHorns'
  | 'noseHorn'
  | 'frill'
  | 'plates'
  | 'tailSpikes'
  | 'sail'
  | 'crest'
  | 'domeSkull'
  | 'tailClub'
  | 'feathers';

export interface FeatureGene {
  kind: FeatureKind;
  /** the slot whose weights govern this feature's expression */
  slot: PartSlot;
}

export type Archetype =
  | 'theropod'
  | 'ceratopsian'
  | 'armored'
  | 'sauropod'
  | 'ornithopod'
  | 'marine'
  | 'flyer';

export type Diet = 'Carnivore' | 'Herbivore' | 'Omnivore' | 'Piscivore' | 'Insectivore';

/** Name-composition syllables (GAME-DESIGN §5). */
export interface Syllables {
  /** leading fragment when this species dominates: "Tyranno" */
  prefix: string;
  /** two-species link when this species is secondary: "ceratops" → Tyrannoceratops */
  duo: string;
  /** three-way middle fragment: "cerato" */
  mid: string;
  /** trailing fragment when this species is the minor third: "tops" */
  suffix: string;
}

export interface StatRow {
  attack: number;
  defense: number;
  speed: number;
  brains: number;
}

/** Real-paleontology facts — the honest layer. Never invent these. */
export interface SpeciesFacts {
  scientificName: string;
  period: string;
  era: string;
  diet: Diet;
  habitat: string;
  description: string;
  lengthMeters: number;
  weightKg: number;
  discoveryLocation: string;
}

export interface SpeciesDef {
  id: string;
  /** display name, e.g. "Tyrannosaurus Rex" */
  name: string;
  archetype: Archetype;
  /** included in the terrestrial v1 roster (D-006) */
  inV1: boolean;
  facts: SpeciesFacts;
  morph: MorphVector;
  features: readonly FeatureGene[];
  syllables: Syllables;
  stats: StatRow;
  /** UI accent for sliders/chips (not creature coloring) */
  uiColor: string;
}
