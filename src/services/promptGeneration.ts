/**
 * Enhanced prompt generation system with genetic percentages and variation
 * Creates more detailed and unique prompts for AI image generation
 */

import { dinosaurDatabase } from '../data/dinosaurDatabase';

export interface EnhancedPromptConfig {
  genetics: Array<{ species: string; percentage: number }>;
  traits: string[];
  colors: string[];
  pattern: string;
  texture: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'massive';
  age: 'juvenile' | 'adult' | 'ancient';
  environment: string;
  style: string;
}

export function generateEnhancedPrompt(config: EnhancedPromptConfig): string {
  const {
    genetics,
    traits,
    colors,
    pattern,
    texture,
    size,
    age,
    environment,
    style
  } = config;

  // 1. Build genetic composition with percentages
  const geneticDescription = buildGeneticDescription(genetics);
  
  // 2. Add behavioral/environmental context based on genetics
  const behavioralTraits = inferBehavioralTraits(genetics);
  
  // 3. Create variation seeds for uniqueness
  const variationSeed = generateVariationSeed();
  
  // 4. Build enhanced trait description
  const enhancedTraits = enhanceTraitDescription(traits, genetics);
  
  // 5. Create dynamic color mixing description
  const colorDescription = createColorMixingDescription(colors, pattern);
  
  // 6. Add anatomical specificity
  const anatomicalDetails = generateAnatomicalDetails(genetics);

  const promptParts = [
    `A prehistoric ${size} ${age} hybrid dinosaur creature`,
    geneticDescription,
    enhancedTraits,
    anatomicalDetails,
    colorDescription,
    `with ${texture} texture in a ${environment} environment`,
    behavioralTraits,
    variationSeed,
    style,
    'ultra realistic, detailed, scientific illustration style, cinematic lighting'
  ].filter(part => part && part.trim() !== '');

  return promptParts.join('. ') + '.';
}

function buildGeneticDescription(genetics: Array<{ species: string; percentage: number }>): string {
  if (genetics.length === 0) return '';
  
  const descriptions = genetics.map(({ species, percentage }) => {
    const dino = dinosaurDatabase.find(d => d.name === species);
    if (!dino) return `${percentage}% ${species}`;
    
    // Use the species' distinctive features based on percentage
    const prominence = getProminenceLevel(percentage);
    const era = dino.era || 'prehistoric';
    const category = dino.diet?.toLowerCase() || 'dinosaur';
    
    return `${percentage}% ${species} (${prominence} ${era} ${category} traits)`;
  });
  
  return `genetically combining ${descriptions.join(', ')}`;
}

function getProminenceLevel(percentage: number): string {
  if (percentage >= 40) return 'dominant';
  if (percentage >= 25) return 'significant';
  if (percentage >= 15) return 'moderate';
  return 'subtle';
}

function inferBehavioralTraits(genetics: Array<{ species: string; percentage: number }>): string {
  const behaviors = genetics
    .filter(({ percentage }) => percentage >= 15) // Only significant contributors
    .map(({ species }) => {
      const dino = dinosaurDatabase.find(d => d.name === species);
      if (!dino) return null;
      
      // Infer behavior from diet and habitat
      const behaviorTraits = [];
      if (dino.diet === 'Carnivore') behaviorTraits.push('predatory instincts');
      if (dino.diet === 'Herbivore') behaviorTraits.push('foraging behavior');
      if (dino.habitat.includes('plains')) behaviorTraits.push('pack hunting tendencies');
      if (dino.habitat.includes('forest')) behaviorTraits.push('stealth capabilities');
      if (dino.habitat.includes('water')) behaviorTraits.push('aquatic movement patterns');
      
      return behaviorTraits.length > 0 ? behaviorTraits.join(' and ') : null;
    })
    .filter(Boolean);
  
  return behaviors.length > 0 ? `Displaying ${behaviors.join(', ')}` : '';
}

function generateVariationSeed(): string {
  const variations = [
    'with unique scarring patterns',
    'showing battle-worn features',
    'displaying seasonal plumage variations',
    'with distinct sexual dimorphism traits',
    'featuring age-specific characteristics',
    'showing regional adaptation features',
    'with distinctive territorial markings',
    'displaying mating season coloration',
    'featuring weather-adapted features',
    'with individual genetic mutations',
    'showing pack hierarchy markings',
    'with distinctive hunting scars',
    'displaying alpha predator features',
    'featuring unique camouflage patterns',
    'with evolutionary adaptation markers'
  ];
  
  // 70% chance to add a variation seed for uniqueness
  return Math.random() < 0.7 ? variations[Math.floor(Math.random() * variations.length)] : '';
}

function enhanceTraitDescription(traits: string[], genetics: Array<{ species: string; percentage: number }>): string {
  if (traits.length === 0) return '';
  
  // Map traits to more specific descriptions based on genetic composition
  const enhancedTraits = traits.map(trait => {
    const dominantSpecies = genetics.find(g => g.percentage >= 25); // Find significant contributor
    if (!dominantSpecies) return trait;
    
    const dino = dinosaurDatabase.find(d => d.name === dominantSpecies.species);
    if (!dino) return trait;
    
    // Enhance trait based on species characteristics
    return enhanceTraitForSpecies(trait, dino);
  });
  
  return `The creature features ${enhancedTraits.join(', ')}`;
}

function enhanceTraitForSpecies(trait: string, species: any): string {
  const enhancements: Record<string, Record<string, string>> = {
    'long neck': {
      'herbivore': 'an extremely elongated, muscular neck with distinctive vertebrae',
      'carnivore': 'a serpentine, predatory neck with enhanced flexibility',
      'piscivore': 'a streamlined neck adapted for aquatic hunting',
      default: 'an extended neck with visible musculature'
    },
    'sharp teeth': {
      'carnivore': 'razor-sharp, serrated teeth designed for tearing flesh',
      'omnivore': 'varied dentition with both cutting and grinding capabilities',
      'piscivore': 'needle-like teeth perfect for catching slippery prey',
      default: 'prominent, pointed teeth'
    },
    'armor plating': {
      'herbivore': 'thick, overlapping bony plates with intricate patterns',
      'carnivore': 'lightweight armor that doesn\'t impede mobility',
      default: 'protective armor plating'
    },
    'wings': {
      'carnivore': 'primitive wings with developing flight capabilities',
      default: 'wing structures with varying development'
    },
    'claws': {
      'carnivore': 'massive curved talons designed for grasping and tearing',
      default: 'prominent clawed appendages'
    },
    'spikes': {
      'herbivore': 'defensive spikes integrated into armor plating',
      'carnivore': 'offensive spikes used for territorial displays',
      default: 'prominent spike formations'
    },
    'horns': {
      'herbivore': 'elaborate cranial horn formations for defense and display',
      'carnivore': 'predatory horns for intimidation and combat',
      default: 'horn structures'
    }
  };
  
  const category = species.diet?.toLowerCase() || 'default';
  return enhancements[trait]?.[category] || enhancements[trait]?.default || trait;
}

function createColorMixingDescription(colors: string[], pattern: string): string {
  if (colors.length === 0) return '';
  
  const colorNames = colors.map(hex => getColorName(hex));
  const patternDescriptions: Record<string, string> = {
    'solid': 'uniform coloration',
    'stripes': 'bold striping patterns',
    'spots': 'distinctive spot patterns',
    'gradient': 'smooth color transitions',
    'rosettes': 'leopard-like rosette markings',
    'tribal': 'geometric tribal patterns',
    'hexagonal': 'honeycomb-like patterns',
    'marble': 'marbled stone patterns'
  };
  
  if (colors.length === 1) {
    return `Rich ${colorNames[0]} coloration with ${patternDescriptions[pattern] || pattern} markings`;
  } else {
    return `Dynamic color scheme blending ${colorNames.join(' and ')} in ${patternDescriptions[pattern] || pattern} patterns`;
  }
}

function generateAnatomicalDetails(genetics: Array<{ species: string; percentage: number }>): string {
  const anatomicalFeatures = genetics
    .filter(({ percentage }) => percentage >= 20) // Only significant contributors
    .map(({ species }) => {
      const dino = dinosaurDatabase.find(d => d.name === species);
      if (!dino) return null;
      
      // Generate specific anatomical details based on species
      const features = [];
      
      // Infer category from traits and characteristics
      const traits = dino.traits.map(t => t.toLowerCase());
      const diet = dino.diet.toLowerCase();
      
      if (traits.some(t => t.includes('sauropod') || t.includes('long neck'))) {
        features.push('elongated vertebrae', 'powerful limb structure');
      }
      if (diet === 'carnivore' || traits.some(t => t.includes('bipedal'))) {
        features.push('sharp talons', 'muscular jaw structure');
      }
      if (traits.some(t => t.includes('armor') || t.includes('plat'))) {
        features.push('defensive osteoderms', 'reinforced skeletal structure');
      }
      if (traits.some(t => t.includes('horn'))) {
        features.push('cranial horn formations', 'thick skull plating');
      }
      if (dino.habitat.includes('water') || dino.habitat.includes('marine')) {
        features.push('streamlined body shape', 'paddle-like appendages');
      }
      if (diet === 'carnivore') {
        features.push('predatory muscle definition', 'enhanced sensory organs');
      }
      
      return features.length > 0 ? features.join(', ') : null;
    })
    .filter(Boolean);
  
  return anatomicalFeatures.length > 0 
    ? `Anatomical features include ${anatomicalFeatures.join('; ')}`
    : '';
}

function getColorName(hex: string): string {
  // Convert hex to readable color names
  const colorMap: Record<string, string> = {
    '#ff0000': 'crimson red',
    '#00ff00': 'vibrant green',
    '#0000ff': 'deep blue',
    '#ffff00': 'bright yellow',
    '#ff00ff': 'magenta',
    '#00ffff': 'cyan',
    '#ffa500': 'orange',
    '#800080': 'purple',
    '#ffd700': 'golden',
    '#8b4513': 'saddle brown',
    '#32cd32': 'lime green',
    '#8b00ff': 'violet',
    '#adff2f': 'green yellow',
    '#dc143c': 'crimson',
    '#00ced1': 'dark turquoise',
    '#ff1493': 'deep pink',
    '#228b22': 'forest green',
    '#4b0082': 'indigo',
    '#daa520': 'goldenrod'
  };
  
  return colorMap[hex.toLowerCase()] || `custom color (${hex})`;
}