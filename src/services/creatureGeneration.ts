import { imageGenerationService, GenerationConfig } from "@/services/imageGeneration";
import { appConfig } from "@/config/app";
import { generateEnhancedPrompt, EnhancedPromptConfig } from "./promptGeneration";

/**
 * Generated creature data structure with full metadata
 */
export interface GeneratedCreature {
  id: string;              // Unique identifier for the creature
  name: string;            // Display name for the creature
  scientificName?: string; // Generated scientific nomenclature
  imageUrl: string;        // Base64 data URL or external URL of creature image
  timestamp: Date;         // When the creature was generated
  algorithm: string;       // Generation algorithm used
  rating: number;          // User rating (0-5 stars)
  isFavorite: boolean;     // Whether marked as favorite
  tags: string[];          // Searchable tags (traits, colors, etc.)
  generationParams: any;   // Full parameters used for generation
  metadata?: {
    provider: string;      // AI provider used (huggingface, openai, etc.)
    model: string;         // Specific model used
    seed?: number;         // Generation seed (if available)
    steps?: number;        // Number of diffusion steps
    guidance?: number;     // Guidance scale used
    cost?: number;         // Generation cost
    timeMs?: number;       // Generation time
  };
}

/**
 * Input parameters for dinosaur generation
 */
export interface DinosaurGenerationParams {
  dinosaurs: any[];
  selectedColors: string[];
  selectedPattern: string;
  colorEffects: string[];
  selectedTexture: string;
  creatureSize: number;
  ageStage: 'juvenile' | 'adult';
  traitSelections: any;
  backgroundSettings: any;
  selectedBackground: string;
}

export interface AIGenerationParams {
  promptText?: string;
  batchSize?: number;
  algorithm?: string;
  steps?: number;
  guidance?: number;
  width?: number;
  height?: number;
}

/**
 * Generate hybrid dinosaur creatures with AI-powered image generation
 * 
 * This is the main creature generation function that orchestrates the complete
 * process from genetic mixing to AI image generation. It combines multiple
 * dinosaur species, applies customizations, and generates realistic images
 * using the configured AI providers.
 * 
 * Process Overview:
 * 1. DNA Analysis - Process selected dinosaur genetics
 * 2. Prompt Engineering - Build detailed AI generation prompts
 * 3. AI Generation - Create images using multi-provider system
 * 4. Scientific Analysis - Generate names and behavioral profiles
 * 5. Finalization - Package results with metadata
 * 
 * @param dinoParams - Dinosaur selection and customization parameters
 * @param aiParams - AI generation settings (steps, guidance, dimensions)
 * @param scientificProfile - Pre-generated scientific data for the creature
 * @param onProgress - Optional callback for progress updates (stage, percentage)
 * @returns Promise resolving to array of generated creatures with full metadata
 * 
 * @throws Error if generation fails critically (network issues, invalid config)
 * 
 * @example
 * ```typescript
 * const creatures = await generateHybridCreatures(
 *   {
 *     dinosaurs: [tRex, stegosaurus],
 *     selectedColors: ['red', 'brown'],
 *     selectedPattern: 'stripes',
 *     creatureSize: 1.2,
 *     ageStage: 'adult'
 *   },
 *   { batchSize: 3, steps: 20 },
 *   scientificData,
 *   (stage, progress) => console.log(`${stage}: ${progress}%`)
 * );
 * ```
 */
export async function generateHybridCreatures(
  dinoParams: DinosaurGenerationParams,
  aiParams: AIGenerationParams = {},
  scientificProfile: any,
  onProgress?: (stage: string, progress: number) => void
): Promise<GeneratedCreature[]> {
  
  const {
    dinosaurs,
    selectedColors,
    selectedPattern,
    colorEffects,
    selectedTexture,
    creatureSize,
    ageStage,
    traitSelections,
    backgroundSettings,
    selectedBackground
  } = dinoParams;

  const {
    promptText,
    batchSize = 1,
    algorithm = "genetic",
    steps = 30,
    guidance = 7.5,
    width = 1024,
    height = 1024
  } = aiParams;

  try {
    // Stage 1: Analyzing DNA
    onProgress?.('Analyzing', 20);
    await delay(800);

    // Get active dinosaurs with DNA percentages
    const activeDinosaurs = dinosaurs.filter(d => d.percentage > 0);
    
    if (activeDinosaurs.length === 0) {
      throw new Error("No dinosaur species selected for hybridization");
    }

    // Collect trait preferences
    const includedTraits: string[] = [];
    const excludedTraits: string[] = [];
    
    activeDinosaurs.forEach(dino => {
      const selections = traitSelections[dino.id] || {};
      dino.traits.forEach(trait => {
        const state = selections[trait] || "default";
        if (state === "included") {
          includedTraits.push(trait.toLowerCase());
        } else if (state === "excluded") {
          excludedTraits.push(trait.toLowerCase());
        }
      });
    });

    // Stage 2: Sequencing
    onProgress?.('Sequencing', 40);
    await delay(800);
    
    // Build enhanced prompt configuration from genetics and traits
    const genetics = activeDinosaurs.map(dino => ({
      species: dino.name,
      percentage: dino.percentage
    }));

    // Collect trait preferences - convert to array of strings
    const selectedTraits: string[] = [];
    activeDinosaurs.forEach(dino => {
      const selections = traitSelections[dino.id] || {};
      dino.traits.forEach(trait => {
        const state = selections[trait] || "default";
        if (state === "included") {
          selectedTraits.push(trait);
        }
      });
    });

    // If no traits selected, use dominant species traits
    if (selectedTraits.length === 0) {
      const dominantDino = activeDinosaurs.reduce((prev, current) => 
        (prev.percentage > current.percentage) ? prev : current
      );
      selectedTraits.push(...dominantDino.traits.slice(0, 3)); // Top 3 traits from dominant species
    }

    // Map size number to size category
    const sizeCategory = creatureSize < 25 ? 'tiny' : 
                        creatureSize < 50 ? 'small' : 
                        creatureSize < 75 ? 'medium' : 
                        creatureSize > 85 ? 'massive' : 'large';

    // Map background
    const environment = selectedBackground === 'custom' ? 'ancient landscape' : selectedBackground;

    // Build enhanced prompt configuration
    const promptConfig: EnhancedPromptConfig = {
      genetics,
      traits: selectedTraits,
      colors: selectedColors,
      pattern: selectedPattern,
      texture: selectedTexture || 'smooth',
      size: sizeCategory as any,
      age: ageStage,
      environment,
      style: 'scientific illustration style'
    };

    // Generate enhanced prompt with percentages and variation
    const enhancedPrompt = generateEnhancedPrompt(promptConfig);
    
    // Add custom prompt text if provided
    const finalPrompt = promptText ? `${promptText}. ${enhancedPrompt}` : enhancedPrompt;
    
    console.log("🧬 Enhanced prompt with genetics:", finalPrompt);

    // Store prompt details for display in gallery
    const promptDetails = {
      enhancedPrompt,
      finalPrompt,
      customPrompt: promptText,
      promptConfig
    };

    // Stage 3: Generating
    onProgress?.('Generating', 70);
    
    // Note: API keys are now managed automatically by the multi-provider system
    // No need to set API key manually

    const generationConfig: GenerationConfig = {
      prompt: finalPrompt,
      model: appConfig.imageGeneration.defaultModel,
      steps,
      guidance,
      width,
      height,
      negativePrompt: "blurry, low quality, distorted, deformed, mutated, extra limbs, missing limbs, ugly, bad anatomy, poorly drawn"
    };

    // Generate images - create array of configs for batch generation
    console.log('🧬 Starting AI generation with config:', generationConfig);
    const configs = Array.from({ length: batchSize }, () => ({ ...generationConfig }));
    const generationResults = await imageGenerationService.generateBatch(configs);

    console.log('🎯 Generation results:', generationResults);

    // Stage 4: Finalizing
    onProgress?.('Finalizing', 90);
    
    // Create creature objects from generation results
    const newCreatures: GeneratedCreature[] = generationResults.map((result, i) => {
      if (!result.success) {
        const errorMessage = result.error || 'Unknown error';
        console.error(`💥 Generation ${i + 1} failed:`, errorMessage);
        
        // Check for permission errors specifically
        if (errorMessage.includes('INSUFFICIENT_PERMISSIONS')) {
          console.warn('🔑 API key lacks proper permissions - consider switching to demo mode');
        }
        
        // Create placeholder creature for failed generations
        return {
          id: `creature-${Date.now()}-${i}`,
          name: `Hybrid ${i + 1} (Failed)`,
          scientificName: scientificProfile?.scientificName?.fullName,
          imageUrl: "data:image/svg+xml;base64," + btoa(`
            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#1a1a1a"/>
              <text x="50%" y="40%" text-anchor="middle" dy=".3em" fill="#666" font-family="Arial" font-size="20">
                Generation Failed
              </text>
              <text x="50%" y="55%" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial" font-size="10">
                ${result.error?.substring(0, 50) || 'Unknown error'}...
              </text>
              <text x="50%" y="70%" text-anchor="middle" dy=".3em" fill="#888" font-family="Arial" font-size="8">
                Check console for details
              </text>
            </svg>
          `),
          timestamp: new Date(),
          algorithm,
          rating: 0,
          isFavorite: false,
          tags: [selectedPattern, selectedTexture, ...colorEffects, 'failed'],
          generationParams: { ...dinoParams, ...aiParams, promptDetails }
        };
      }

      console.log(`✅ Generation ${i + 1} successful`);
      return {
        id: `creature-${Date.now()}-${i}`,
        name: `Hybrid ${i + 1}`,
        scientificName: scientificProfile?.scientificName?.fullName,
        imageUrl: result.imageUrl!,
        timestamp: new Date(),
        algorithm,
        rating: 0,
        isFavorite: false,
        tags: [selectedPattern, selectedTexture, ...colorEffects],
        generationParams: { ...dinoParams, ...aiParams, promptDetails },
        metadata: result.metadata
      };
    });

    await delay(500);
    onProgress?.('Complete', 100);
    
    return newCreatures;

  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}