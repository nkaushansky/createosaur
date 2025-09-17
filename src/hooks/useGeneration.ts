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
      if (user) {
        // Authenticated user - use normal generation
        const creatures = await generateHybridCreatures(
          dinoParams,
          aiParams,
          scientificProfile,
          onProgress
        );

        creatures.forEach(creature => onNewCreature?.(creature));

        return {
          success: true,
          creatures
        };
      } else {
        // Anonymous user - use trial system
        return await generateAnonymousCreatures(dinoParams, aiParams, scientificProfile);
      }
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
    // Check trial status
    const trialInfo = AnonymousGenerationService.getTrialInfo();
    
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
      // For now, use the regular generation service but mark it as a trial
      // In production, this would call your server-side anonymous API
      const creatures = await generateHybridCreatures(
        dinoParams,
        aiParams,
        scientificProfile,
        onProgress
      );

      // Record the trial usage
      try {
        import('@/services/freeTrialService').then(({ FreeTrialService }) => {
          FreeTrialService.recordGeneration();
        });
      } catch (e) {
        console.warn('Failed to record trial usage:', e);
      }

      creatures.forEach(creature => onNewCreature?.(creature));

      // Get updated trial info
      const updatedTrialInfo = AnonymousGenerationService.getTrialInfo();

      // Show trial status toast
      if (updatedTrialInfo.remainingGenerations === 0) {
        toast({
          title: "Trial Complete! 🎉",
          description: "Ready to create unlimited creatures? Add your API key or try our credit system.",
          duration: 6000
        });
      } else if (updatedTrialInfo.remainingGenerations === 1) {
        toast({
          title: "One More Free Generation!",
          description: "After this, you can continue with your own API key or our credit system.",
          duration: 5000
        });
      }

      return {
        success: true,
        creatures,
        needsUpgrade: updatedTrialInfo.remainingGenerations === 0,
        conversionMessage: updatedTrialInfo.conversionMessage,
        remainingGenerations: updatedTrialInfo.remainingGenerations
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