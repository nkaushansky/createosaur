/**
 * Simplified and optimized prompt generation for AI image models
 * Focuses on clarity, brevity, and effectiveness for stable diffusion models
 */

import { dinosaurDatabase } from '../data/dinosaurDatabase';

export interface SimplePromptConfig {
  genetics: Array<{ species: string; percentage: number }>;
  traits: string[];
  colors: string[];
  pattern: string;
  texture?: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'massive';
  age: 'juvenile' | 'adult' | 'ancient';
  environment: string;
  style?: string;
  customPrompt?: string;
}

/**
 * Generates a concise, effective prompt for AI image generation
 * Maximum ~150-200 characters for optimal results
 */
export function generateSimplePrompt(config: SimplePromptConfig): string {
  const { genetics, colors, pattern, size, age, environment, customPrompt } = config;

  // If custom prompt provided, use it with minimal enhancement
  if (customPrompt?.trim()) {
    return `${customPrompt.trim()}, highly detailed, photorealistic`;
  }

  // 1. Main subject - simplified hybrid description
  const creature = buildCreatureDescription(genetics, size, age);
  
  // 2. Key visual features - colors and pattern
  const appearance = buildAppearanceDescription(colors, pattern);
  
  // 3. Environment - simple background
  const setting = simplifyEnvironment(environment);
  
  // 4. Quality tags - minimal but effective
  const quality = 'highly detailed, photorealistic, cinematic lighting';

  // Combine into concise prompt (aim for <200 chars)
  const parts = [creature, appearance, setting, quality].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Creates a simple creature description focusing on dominant genetics
 */
function buildCreatureDescription(genetics: Array<{ species: string; percentage: number }>, size: string, age: string): string {
  if (genetics.length === 0) {
    return `${size} ${age} dinosaur`;
  }

  // Sort by percentage and take top 2 most prominent
  const sortedGenetics = genetics
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 2);

  if (sortedGenetics.length === 1) {
    return `${size} ${age} ${simplifySpeciesName(sortedGenetics[0].species)}`;
  }

  // For hybrids, use simple format: "T-Rex-Triceratops hybrid"
  const primary = simplifySpeciesName(sortedGenetics[0].species);
  const secondary = simplifySpeciesName(sortedGenetics[1].species);
  
  return `${size} ${age} ${primary}-${secondary} hybrid dinosaur`;
}

/**
 * Simplifies species names for better AI recognition
 */
function simplifySpeciesName(species: string): string {
  const nameMap: Record<string, string> = {
    'Tyrannosaurus Rex': 'T-Rex',
    'Tyrannosaurus': 'T-Rex',
    'Velociraptor': 'Velociraptor',
    'Triceratops': 'Triceratops',
    'Stegosaurus': 'Stegosaurus',
    'Brachiosaurus': 'Brachiosaurus',
    'Allosaurus': 'Allosaurus',
    'Ankylosaurus': 'Ankylosaurus',
    'Parasaurolophus': 'Parasaurolophus',
    'Spinosaurus': 'Spinosaurus',
    'Carnotaurus': 'Carnotaurus',
    'Dilophosaurus': 'Dilophosaurus'
  };

  return nameMap[species] || species.split(' ')[0]; // Use first word if not mapped
}

/**
 * Creates concise color and pattern description
 */
function buildAppearanceDescription(colors: string[], pattern: string): string {
  if (colors.length === 0) return '';

  // Convert hex to color names for better AI understanding
  const colorNames = colors.map(convertHexToColorName).slice(0, 2); // Max 2 colors
  
  const colorDesc = colorNames.length === 1 
    ? colorNames[0]
    : `${colorNames[0]} and ${colorNames[1]}`;

  // Simplify pattern names
  const patternMap: Record<string, string> = {
    'stripes': 'striped',
    'spots': 'spotted', 
    'camouflage': 'camouflaged',
    'gradient': 'gradient',
    'solid': '',
    'tiger': 'tiger-striped',
    'leopard': 'leopard-spotted'
  };

  const patternDesc = patternMap[pattern] || pattern;
  
  return patternDesc ? `${patternDesc} ${colorDesc}` : colorDesc;
}

/**
 * Converts hex colors to simple color names AI models understand better
 */
function convertHexToColorName(hex: string): string {
  const colorMap: Record<string, string> = {
    '#ff0000': 'red',
    '#00ff00': 'green', 
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#ff8000': 'orange',
    '#8000ff': 'purple',
    '#ff0080': 'pink',
    '#00ffff': 'cyan',
    '#ffffff': 'white',
    '#000000': 'black',
    '#808080': 'gray',
    '#800000': 'dark red',
    '#008000': 'dark green',
    '#000080': 'dark blue',
    '#8b4513': 'brown',
    '#ffd700': 'gold'
  };

  // If exact match found
  if (colorMap[hex.toLowerCase()]) {
    return colorMap[hex.toLowerCase()];
  }

  // Simple heuristic for common colors
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  // Determine dominant color channel
  if (r > g && r > b) return r > 200 ? 'bright red' : 'red';
  if (g > r && g > b) return g > 200 ? 'bright green' : 'green';
  if (b > r && b > g) return b > 200 ? 'bright blue' : 'blue';
  if (r > 150 && g > 150 && b < 100) return 'yellow';
  if (r > 150 && g < 100 && b > 150) return 'purple';
  if (r < 100 && g > 150 && b > 150) return 'cyan';
  if (r > 100 && g > 100 && b > 100) return 'gray';
  
  return 'multicolored';
}

/**
 * Simplifies environment descriptions
 */
function simplifyEnvironment(environment: string): string {
  const environmentMap: Record<string, string> = {
    'jungle': 'jungle background',
    'desert': 'desert background', 
    'forest': 'forest background',
    'plains': 'grassland background',
    'mountains': 'mountain background',
    'swamp': 'swamp background',
    'arctic': 'snowy background',
    'volcanic': 'volcanic background',
    'cave': 'cave background',
    'beach': 'beach background'
  };

  return environmentMap[environment] || 'natural background';
}

/**
 * Generates minimal prompt for maximum compatibility
 * Use this for providers that work better with very short prompts
 */
export function generateMinimalPrompt(config: SimplePromptConfig): string {
  const { genetics, colors, customPrompt } = config;

  if (customPrompt?.trim()) {
    return customPrompt.trim();
  }

  const creature = genetics.length > 0 
    ? simplifySpeciesName(genetics[0].species) 
    : 'dinosaur';
  
  const color = colors.length > 0 
    ? convertHexToColorName(colors[0])
    : '';

  return [creature, color, 'realistic'].filter(Boolean).join(' ');
}

/**
 * Enhanced prompt for high-end models (GPT-4, Claude, etc.)
 * Only use with models that can handle longer, more detailed prompts
 */
export function generateDetailedPrompt(config: SimplePromptConfig): string {
  const { genetics, traits, colors, pattern, size, age, environment, customPrompt } = config;

  if (customPrompt?.trim()) {
    return `${customPrompt.trim()}, professional wildlife photography style, award winning, highly detailed, photorealistic, perfect anatomy, cinematic lighting, 8k resolution`;
  }

  const creature = buildCreatureDescription(genetics, size, age);
  const appearance = buildAppearanceDescription(colors, pattern);
  const setting = simplifyEnvironment(environment);
  
  // Add selective trait information (only most important ones)
  const keyTraits = traits
    .filter(trait => ['armored', 'flying', 'aquatic', 'massive', 'tiny'].some(key => 
      trait.toLowerCase().includes(key)))
    .slice(0, 2)
    .join(', ');

  const parts = [
    creature,
    appearance, 
    keyTraits,
    setting,
    'professional wildlife photography style, award winning, highly detailed, photorealistic, perfect anatomy, cinematic lighting'
  ].filter(Boolean);

  return parts.join(', ');
}

// Export the main function (use simple by default)
export const generatePrompt = generateSimplePrompt;