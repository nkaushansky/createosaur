export interface TraitDefinition {
  id: string;
  name: string;
  category: TraitCategory;
  conflicts: string[];
  synergies: string[];
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export type TraitCategory = 'physical' | 'behavioral' | 'defensive' | 'hunting' | 'environmental';

export interface TraitConflict {
  trait1: string;
  trait2: string;
  reason: string;
  severity: 'warning' | 'error';
}

export interface TraitSuggestion {
  trait: string;
  reason: string;
  confidence: number;
}

export const TRAIT_DEFINITIONS: Record<string, TraitDefinition> = {
  'massive jaw': {
    id: 'massive_jaw',
    name: 'Massive jaw',
    category: 'hunting',
    conflicts: ['filter feeding', 'herbivore'],
    synergies: ['sharp teeth', 'predator instincts', 'powerful bite'],
    description: 'Enormous jaw structure for maximum bite force',
    rarity: 'uncommon'
  },
  'powerful legs': {
    id: 'powerful_legs',
    name: 'Powerful legs',
    category: 'physical',
    conflicts: ['aquatic adaptation', 'burrowing'],
    synergies: ['agile', 'sprint speed', 'jumping ability'],
    description: 'Strong muscular legs for running and jumping',
    rarity: 'common'
  },
  'sharp teeth': {
    id: 'sharp_teeth',
    name: 'Sharp teeth',
    category: 'hunting',
    conflicts: ['herbivore', 'filter feeding'],
    synergies: ['massive jaw', 'predator instincts', 'carnivore'],
    description: 'Razor-sharp dental arrangement for tearing flesh',
    rarity: 'common'
  },
  'predator instincts': {
    id: 'predator_instincts',
    name: 'Predator instincts',
    category: 'behavioral',
    conflicts: ['herbivore', 'docile nature', 'grazing behavior'],
    synergies: ['pack hunter', 'sharp teeth', 'stealth', 'ambush tactics'],
    description: 'Natural hunting behaviors and killer instinct',
    rarity: 'common'
  },
  'triple horns': {
    id: 'triple_horns',
    name: 'Triple horns',
    category: 'defensive',
    conflicts: ['smooth skull', 'stealth'],
    synergies: ['protective frill', 'charging attack', 'intimidation'],
    description: 'Three prominent horns for defense and display',
    rarity: 'rare'
  },
  'protective frill': {
    id: 'protective_frill',
    name: 'Protective frill',
    category: 'defensive',
    conflicts: ['stealth', 'aquatic adaptation'],
    synergies: ['triple horns', 'intimidation display', 'neck protection'],
    description: 'Large bony frill protecting neck and shoulders',
    rarity: 'uncommon'
  },
  'herbivore': {
    id: 'herbivore',
    name: 'Herbivore',
    category: 'behavioral',
    conflicts: ['sharp teeth', 'predator instincts', 'carnivore', 'pack hunter'],
    synergies: ['grazing behavior', 'plant digestion', 'herd mentality'],
    description: 'Plant-eating digestive system and behavior',
    rarity: 'common'
  },
  'sturdy build': {
    id: 'sturdy_build',
    name: 'Sturdy build',
    category: 'physical',
    conflicts: ['lightweight frame', 'agile'],
    synergies: ['armored', 'defensive stance', 'endurance'],
    description: 'Robust, heavily built body structure',
    rarity: 'common'
  },
  'pack hunter': {
    id: 'pack_hunter',
    name: 'Pack hunter',
    category: 'behavioral',
    conflicts: ['solitary', 'herbivore', 'docile nature'],
    synergies: ['high intelligence', 'coordination', 'predator instincts'],
    description: 'Coordinated group hunting behavior',
    rarity: 'uncommon'
  },
  'sickle claws': {
    id: 'sickle_claws',
    name: 'Sickle claws',
    category: 'hunting',
    conflicts: ['blunt claws', 'herbivore'],
    synergies: ['agile', 'climbing ability', 'precision strikes'],
    description: 'Curved retractable claws for slashing attacks',
    rarity: 'rare'
  },
  'high intelligence': {
    id: 'high_intelligence',
    name: 'High intelligence',
    category: 'behavioral',
    conflicts: ['primitive brain', 'instinctual only'],
    synergies: ['pack hunter', 'problem solving', 'tool use', 'learning ability'],
    description: 'Advanced cognitive abilities and problem-solving skills',
    rarity: 'rare'
  },
  'agile': {
    id: 'agile',
    name: 'Agile',
    category: 'physical',
    conflicts: ['sturdy build', 'massive size', 'heavy armor'],
    synergies: ['powerful legs', 'climbing ability', 'quick reflexes'],
    description: 'Quick, nimble movement and flexibility',
    rarity: 'common'
  },
  'back plates': {
    id: 'back_plates',
    name: 'Back plates',
    category: 'defensive',
    conflicts: ['smooth back', 'stealth'],
    synergies: ['armored', 'intimidation display', 'temperature regulation'],
    description: 'Large bony plates along the spine',
    rarity: 'rare'
  },
  'spiked tail': {
    id: 'spiked_tail',
    name: 'Spiked tail',
    category: 'defensive',
    conflicts: ['club tail', 'whip tail'],
    synergies: ['tail weapon', 'defensive stance', 'reach advantage'],
    description: 'Tail ending in dangerous spikes for defense',
    rarity: 'uncommon'
  },
  'armored': {
    id: 'armored',
    name: 'Armored',
    category: 'defensive',
    conflicts: ['lightweight frame', 'stealth', 'agile'],
    synergies: ['sturdy build', 'back plates', 'defensive stance'],
    description: 'Thick, protective skin or bony armor',
    rarity: 'uncommon'
  }
};

export const TRAIT_CATEGORIES: Record<TraitCategory, { name: string; color: string; description: string }> = {
  physical: {
    name: 'Physical',
    color: 'blue',
    description: 'Body structure and physical capabilities'
  },
  behavioral: {
    name: 'Behavioral',
    color: 'purple',
    description: 'Instincts, intelligence, and social behaviors'
  },
  defensive: {
    name: 'Defensive',
    color: 'green',
    description: 'Protection mechanisms and defensive features'
  },
  hunting: {
    name: 'Hunting',
    color: 'red',
    description: 'Predatory capabilities and attack methods'
  },
  environmental: {
    name: 'Environmental',
    color: 'yellow',
    description: 'Adaptation to specific environments'
  }
};