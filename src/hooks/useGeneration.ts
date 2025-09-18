import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AnonymousGenerationService } from '@/services/anonymousGenerationService';
import { generateHybridCreatures, GeneratedCreature, DinosaurGenerationParams, AIGenerationParams } from '@/services/creatureGeneration';
import { useToast } from '@/hooks/use-toast';

interface UseGenerationOptions {
  onProgress?: (stage: string, progress: number) => void;
  onNewCreature?: (creature: GeneratedCreature) => void;
}

interface GenerationResult {
  success: boolean;
  creatures: GeneratedCreature[];
  needsUpgrade?: boolean;
  conversionMessage?: string;
  remainingGenerations?: number;
}

export const useGeneration = ({ onProgress, onNewCreature }: UseGenerationOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCreatures = useCallback(async (
    dinoParams: DinosaurGenerationParams,
    aiParams: AIGenerationParams,
    scientificProfile?: any
  ): Promise<GenerationResult> => {
    setIsGenerating(true);

    try {
      console.log('🔐 Auth check - user:', user ? 'authenticated' : 'anonymous');
      
      // For now, always use anonymous generation to test the API
      console.log('🎯 Using anonymous generation path (forced for testing)');
      return await generateAnonymousCreatures(dinoParams, aiParams, scientificProfile);
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });

      return {
        success: false,
        creatures: []
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user, onProgress, onNewCreature, toast]);

  const generateAnonymousCreatures = async (
    dinoParams: DinosaurGenerationParams,
    aiParams: AIGenerationParams,
    scientificProfile?: any
  ): Promise<GenerationResult> => {
    console.log('🚀 Starting anonymous generation');
    
    // Check trial status
    const trialInfo = AnonymousGenerationService.getTrialInfo();
    console.log('📊 Trial info:', trialInfo);
    
    if (!trialInfo.canGenerate) {
      return {
        success: false,
        creatures: [],
        needsUpgrade: true,
        conversionMessage: trialInfo.conversionMessage,
        remainingGenerations: 0
      };
    }

    try {
      // Build the enhanced prompt using the existing system
      const { generateEnhancedPrompt } = await import('@/services/promptGeneration');
      
      // Get active dinosaurs with DNA percentages
      const activeDinosaurs = dinoParams.dinosaurs.filter(d => d.percentage > 0);
      const genetics = activeDinosaurs.map(dino => ({
        species: dino.name,
        percentage: dino.percentage
      }));

      // Build prompt configuration
      const promptConfig = {
        genetics,
        traits: Object.keys(dinoParams.traitSelections || {}).filter(trait => 
          Object.values(dinoParams.traitSelections?.[trait] || {}).some(state => state === "included")
        ),
        colors: dinoParams.selectedColors,
        pattern: dinoParams.selectedPattern,
        texture: dinoParams.selectedTexture || 'smooth',
        size: dinoParams.creatureSize > 80 ? 'massive' : 
              dinoParams.creatureSize > 60 ? 'large' :
              dinoParams.creatureSize > 40 ? 'medium' :
              dinoParams.creatureSize > 20 ? 'small' : 'tiny',
        age: dinoParams.ageStage,
        environment: dinoParams.selectedBackground === 'custom' ? 'ancient landscape' : dinoParams.selectedBackground,
        style: 'scientific illustration style'
      };

      const enhancedPrompt = generateEnhancedPrompt(promptConfig as any);
      const finalPrompt = aiParams.promptText ? `${aiParams.promptText}. ${enhancedPrompt}` : enhancedPrompt;

      onProgress?.('Generating', 70);

      // Use the anonymous generation service
      const result = await AnonymousGenerationService.generateImage({
        prompt: finalPrompt,
        negativePrompt: "blurry, low quality, distorted, deformed, mutated, extra limbs, missing limbs, ugly, bad anatomy, poorly drawn",
        width: aiParams.width || 768,
        height: aiParams.height || 768,
        steps: aiParams.steps || 15,
        guidance: aiParams.guidance || 7.5
      });

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      // Create creature object
      const creature: GeneratedCreature = {
        id: `creature-${Date.now()}`,
        name: 'Anonymous Hybrid',
        scientificName: scientificProfile?.scientificName?.fullName,
        imageUrl: result.imageUrl!,
        timestamp: new Date(),
        algorithm: aiParams.algorithm || 'genetic',
        rating: 0,
        isFavorite: false,
        tags: [dinoParams.selectedPattern, dinoParams.selectedTexture || 'smooth', ...dinoParams.colorEffects],
        generationParams: { 
          ...dinoParams, 
          ...aiParams,
          promptDetails: {
            enhancedPrompt,
            finalPrompt,
            customPrompt: aiParams.promptText,
            promptConfig
          }
        }
      };

      onNewCreature?.(creature);

      // Show trial status toast
      if (result.remainingGenerations === 0) {
        toast({
          title: "Trial Complete!",
          description: "Ready to create unlimited creatures? Add your API key or try our credit system.",
          duration: 6000
        });
      } else if (result.remainingGenerations === 1) {
        toast({
          title: "One More Free Generation!",
          description: "After this, you can continue with your own API key or our credit system.",
          duration: 5000
        });
      }

      return {
        success: true,
        creatures: [creature],
        needsUpgrade: result.remainingGenerations === 0,
        conversionMessage: result.conversionMessage,
        remainingGenerations: result.remainingGenerations
      };
    } catch (error) {
      console.error('Anonymous generation failed:', error);
      throw error;
    }
  };

  const getTrialStatus = useCallback(() => {
    if (user) return null; // Authenticated users don't have trials
    return AnonymousGenerationService.getTrialInfo();
  }, [user]);

  const shouldShowTrialUI = useCallback(() => {
    return !user; // Show trial UI for anonymous users
  }, [user]);

  return {
    generateCreatures,
    isGenerating,
    getTrialStatus,
    shouldShowTrialUI
  };
};