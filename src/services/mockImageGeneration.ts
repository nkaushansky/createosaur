/**
 * Mock image generation service for demo purposes
 * Creates realistic placeholder images that represent the generated creatures
 */

export interface MockGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    model: string;
    seed: number;
    steps: number;
    guidance: number;
  };
}

export class MockImageGenerationService {
  
  /**
   * Generate a mock creature image based on the prompt
   */
  async generateMockImage(
    prompt: string,
    config: any = {}
  ): Promise<MockGenerationResult> {
    
    // Simulate generation delay
    await this.delay(2000 + Math.random() * 3000);
    
    // Extract key features from prompt for intelligent mock generation
    const features = this.extractFeaturesFromPrompt(prompt);
    
    // Generate SVG-based creature representation
    const imageUrl = this.generateCreatureSVG(features);
    
    return {
      success: true,
      imageUrl,
      metadata: {
        model: 'mock-generator-v1',
        seed: Math.floor(Math.random() * 1000000),
        steps: config.steps || 20,
        guidance: config.guidance || 7.5
      }
    };
  }
  
  /**
   * Extract creature features from the generation prompt
   */
  private extractFeaturesFromPrompt(prompt: string) {
    const features = {
      species: [] as string[],
      colors: [] as string[],
      pattern: 'solid',
      size: 'medium',
      age: 'adult',
      traits: [] as string[]
    };
    
    // Extract dinosaur species (using names instead of emojis for encoding safety)
    const speciesMap = {
      'tyrannosaurus': 'T-Rex',
      't-rex': 'T-Rex', 
      'triceratops': 'Triceratops',
      'velociraptor': 'Raptor',
      'stegosaurus': 'Stegosaurus',
      'brachiosaurus': 'Sauropod',
      'parasaurolophus': 'Hadrosaur'
    };
    
    Object.keys(speciesMap).forEach(species => {
      if (prompt.toLowerCase().includes(species)) {
        features.species.push(speciesMap[species as keyof typeof speciesMap]);
      }
    });
    
    // Extract colors
    const colorRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g;
    const colorMatches = prompt.match(colorRegex) || [];
    features.colors = colorMatches.slice(0, 3);
    
    // Extract patterns
    if (prompt.includes('stripes')) features.pattern = 'stripes';
    else if (prompt.includes('spots')) features.pattern = 'spots';
    else if (prompt.includes('camouflage')) features.pattern = 'camouflage';
    
    // Extract size
    if (prompt.includes('tiny')) features.size = 'tiny';
    else if (prompt.includes('small')) features.size = 'small';
    else if (prompt.includes('massive')) features.size = 'massive';
    else if (prompt.includes('large')) features.size = 'large';
    
    // Extract age
    if (prompt.includes('juvenile')) features.age = 'juvenile';
    
    // Extract key traits
    const traitPatterns = [
      'massive jaw', 'sharp teeth', 'triple horns', 'back plates', 
      'sickle claws', 'pack hunter', 'herbivore', 'carnivore'
    ];
    
    traitPatterns.forEach(trait => {
      if (prompt.toLowerCase().includes(trait.toLowerCase())) {
        features.traits.push(trait);
      }
    });
    
    return features;
  }
  
  /**
   * Generate an SVG representation of the creature
   */
  private generateCreatureSVG(features: any): string {
    const width = 512;
    const height = 512;
    
    // Determine primary color
    const primaryColor = features.colors[0] || '#8B4513';
    const secondaryColor = features.colors[1] || '#654321';
    const accentColor = features.colors[2] || '#A0522D';
    
    // Size scaling
    const sizeScale = {
      tiny: 0.6,
      small: 0.8,
      medium: 1.0,
      large: 1.2,
      massive: 1.4
    }[features.size] || 1.0;
    
    // Generate creature body
    const bodyElements = this.generateCreatureBody(features, sizeScale, primaryColor, secondaryColor);
    const patternElements = this.generatePatternOverlay(features, accentColor);
    const traitElements = this.generateTraitFeatures(features, accentColor);
    
    // Background
    const background = this.generateBackground();
    
    // Create species display without emojis (ASCII safe)
    const speciesText = features.species.length > 0 ? 
      `Species: ${features.species.length} combined` : 
      'Hybrid Creature';
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#2a5934;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a3324;stop-opacity:1" />
          </radialGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        ${background}
        
        <!-- Creature Body -->
        ${bodyElements}
        
        <!-- Pattern Overlay -->
        ${patternElements}
        
        <!-- Trait Features -->
        ${traitElements}
        
        <!-- Info Text -->
        <text x="20" y="30" fill="#ffffff" font-family="Arial" font-size="14" font-weight="bold">
          DEMO CREATURE
        </text>
        <text x="20" y="50" fill="#cccccc" font-family="Arial" font-size="10">
          ${speciesText}
        </text>
        <text x="20" y="${height - 40}" fill="#999999" font-family="Arial" font-size="8">
          Features: ${features.traits.slice(0, 2).join(', ') || 'Hybrid traits'}
        </text>
        <text x="20" y="${height - 25}" fill="#999999" font-family="Arial" font-size="8">
          Size: ${features.size} • Age: ${features.age}
        </text>
        <text x="20" y="${height - 10}" fill="#666666" font-family="Arial" font-size="8">
          Add API key for real AI generation
        </text>
      </svg>
    `;
    
    // Use URL encoding instead of btoa to handle Unicode characters safely
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /**
   * Helper method to safely convert SVG to data URL
   */
  private svgToDataUrl(svg: string): string {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  
  private generateCreatureBody(features: any, scale: number, primary: string, secondary: string): string {
    const centerX = 256;
    const centerY = 280;
    
    return `
      <!-- Main Body -->
      <ellipse cx="${centerX}" cy="${centerY}" rx="${120 * scale}" ry="${80 * scale}" 
               fill="${primary}" stroke="${secondary}" stroke-width="3" filter="url(#shadow)"/>
      
      <!-- Head -->
      <ellipse cx="${centerX}" cy="${centerY - 100 * scale}" rx="${60 * scale}" ry="${50 * scale}" 
               fill="${primary}" stroke="${secondary}" stroke-width="2"/>
      
      <!-- Legs -->
      <rect x="${centerX - 80 * scale}" y="${centerY + 40 * scale}" width="${20 * scale}" height="${60 * scale}" 
            fill="${secondary}" rx="10"/>
      <rect x="${centerX - 40 * scale}" y="${centerY + 40 * scale}" width="${20 * scale}" height="${60 * scale}" 
            fill="${secondary}" rx="10"/>
      <rect x="${centerX + 20 * scale}" y="${centerY + 40 * scale}" width="${20 * scale}" height="${60 * scale}" 
            fill="${secondary}" rx="10"/>
      <rect x="${centerX + 60 * scale}" y="${centerY + 40 * scale}" width="${20 * scale}" height="${60 * scale}" 
            fill="${secondary}" rx="10"/>
      
      <!-- Tail -->
      <ellipse cx="${centerX + 140 * scale}" cy="${centerY + 20 * scale}" rx="${40 * scale}" ry="${15 * scale}" 
               fill="${primary}" stroke="${secondary}" stroke-width="2"/>
    `;
  }
  
  private generatePatternOverlay(features: any, color: string): string {
    const centerX = 256;
    const centerY = 280;
    
    if (features.pattern === 'stripes') {
      return `
        <g opacity="0.6">
          <rect x="${centerX - 100}" y="${centerY - 60}" width="10" height="120" fill="${color}"/>
          <rect x="${centerX - 70}" y="${centerY - 60}" width="10" height="120" fill="${color}"/>
          <rect x="${centerX - 40}" y="${centerY - 60}" width="10" height="120" fill="${color}"/>
          <rect x="${centerX - 10}" y="${centerY - 60}" width="10" height="120" fill="${color}"/>
          <rect x="${centerX + 20}" y="${centerY - 60}" width="10" height="120" fill="${color}"/>
          <rect x="${centerX + 50}" y="${centerY - 60}" width="10" height="120" fill="${color}"/>
        </g>
      `;
    } else if (features.pattern === 'spots') {
      return `
        <g opacity="0.7">
          <circle cx="${centerX - 50}" cy="${centerY - 30}" r="8" fill="${color}"/>
          <circle cx="${centerX - 20}" cy="${centerY - 10}" r="6" fill="${color}"/>
          <circle cx="${centerX + 10}" cy="${centerY - 40}" r="7" fill="${color}"/>
          <circle cx="${centerX + 40}" cy="${centerY - 15}" r="5" fill="${color}"/>
          <circle cx="${centerX - 30}" cy="${centerY + 20}" r="6" fill="${color}"/>
          <circle cx="${centerX + 20}" cy="${centerY + 25}" r="8" fill="${color}"/>
        </g>
      `;
    }
    return '';
  }
  
  private generateTraitFeatures(features: any, color: string): string {
    let elements = '';
    const centerX = 256;
    const centerY = 280;
    
    // Add horns for Triceratops traits
    if (features.traits.some((t: string) => t.includes('horn'))) {
      elements += `
        <polygon points="${centerX - 20},${centerY - 130} ${centerX - 15},${centerY - 150} ${centerX - 10},${centerY - 130}" 
                 fill="${color}" stroke="#333" stroke-width="1"/>
        <polygon points="${centerX + 10},${centerY - 130} ${centerX + 15},${centerY - 150} ${centerX + 20},${centerY - 130}" 
                 fill="${color}" stroke="#333" stroke-width="1"/>
      `;
    }
    
    // Add back plates for Stegosaurus traits
    if (features.traits.some((t: string) => t.includes('plate'))) {
      elements += `
        <polygon points="${centerX - 40},${centerY - 80} ${centerX - 30},${centerY - 100} ${centerX - 20},${centerY - 80}" 
                 fill="${color}" stroke="#333" stroke-width="1"/>
        <polygon points="${centerX - 10},${centerY - 85} ${centerX},${centerY - 105} ${centerX + 10},${centerY - 85}" 
                 fill="${color}" stroke="#333" stroke-width="1"/>
        <polygon points="${centerX + 20},${centerY - 80} ${centerX + 30},${centerY - 100} ${centerX + 40},${centerY - 80}" 
                 fill="${color}" stroke="#333" stroke-width="1"/>
      `;
    }
    
    // Add eyes
    elements += `
      <circle cx="${centerX - 20}" cy="${centerY - 110}" r="6" fill="#ffffff" stroke="#333" stroke-width="1"/>
      <circle cx="${centerX + 20}" cy="${centerY - 110}" r="6" fill="#ffffff" stroke="#333" stroke-width="1"/>
      <circle cx="${centerX - 20}" cy="${centerY - 110}" r="3" fill="#333"/>
      <circle cx="${centerX + 20}" cy="${centerY - 110}" r="3" fill="#333"/>
    `;
    
    return elements;
  }
  
  private generateBackground(): string {
    return `
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <!-- Simple jungle background -->
      <ellipse cx="100" cy="400" rx="50" ry="80" fill="#2d5a3d" opacity="0.6"/>
      <ellipse cx="400" cy="420" rx="60" ry="70" fill="#2d5a3d" opacity="0.6"/>
      <ellipse cx="50" cy="350" rx="30" ry="90" fill="#234a35" opacity="0.7"/>
      <ellipse cx="450" cy="380" rx="40" ry="85" fill="#234a35" opacity="0.7"/>
    `;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockImageGenerationService = new MockImageGenerationService();