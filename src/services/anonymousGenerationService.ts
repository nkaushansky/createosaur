/**
 * Anonymous Generation Service
 * Handles free trial generations using server-side API keys
 */

import { FreeTrialService } from './freeTrialService';
import { GenerationConfig } from './imageGeneration';

interface AnonymousGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

interface AnonymousGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  remainingGenerations: number;
  trialStatus: 'active' | 'exhausted' | 'upgrade_suggested';
  conversionMessage: string;
}

export class AnonymousGenerationService {
  private static readonly API_ENDPOINT = '/api/anonymous-generate';

  /**
   * Generate image for anonymous user using server API keys
   */
  static async generateImage(config: AnonymousGenerationRequest): Promise<AnonymousGenerationResponse> {
    // Check trial status first
    if (!FreeTrialService.canGenerate()) {
      return {
        success: false,
        error: 'Trial limit exceeded',
        remainingGenerations: 0,
        trialStatus: 'exhausted',
        conversionMessage: FreeTrialService.getConversionMessage()
      };
    }

    try {
      // Record the generation attempt
      const updatedUsage = FreeTrialService.recordGeneration();
      
      // For now, we'll use the existing generation service with a mock "anonymous" mode
      // In production, this would call your server-side API
      const result = await this.mockServerGeneration(config);
      
      const remaining = FreeTrialService.getRemainingGenerations();
      
      return {
        success: result.success,
        imageUrl: result.imageUrl,
        error: result.error,
        remainingGenerations: remaining,
        trialStatus: remaining > 0 ? 'active' : 'exhausted',
        conversionMessage: FreeTrialService.getConversionMessage()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        remainingGenerations: FreeTrialService.getRemainingGenerations(),
        trialStatus: 'active',
        conversionMessage: FreeTrialService.getConversionMessage()
      };
    }
  }

  /**
   * Mock server generation for development
   * In production, this would be a server-side API call
   */
  private static async mockServerGeneration(config: AnonymousGenerationRequest): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
  }> {
    // For development, we'll use the existing image generation service
    // but with a special "anonymous" flag
    try {
      const { imageGenerationService } = await import('./imageGeneration');
      
      const generationConfig: GenerationConfig = {
        prompt: config.prompt,
        negativePrompt: config.negativePrompt || 'blurry, low quality, distorted',
        width: config.width || 1024,
        height: config.height || 1024,
        steps: config.steps || 20,
        guidance: config.guidance || 7.5,
        model: 'stable-diffusion-xl-base-1.0' // Use a reliable model for trials
      };

      const result = await imageGenerationService.generateImage(generationConfig);
      
      if (result.success && result.imageUrl) {
        return {
          success: true,
          imageUrl: result.imageUrl
        };
      } else {
        return {
          success: false,
          error: result.error || 'Generation failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get trial status without generating
   */
  static getTrialInfo(): {
    canGenerate: boolean;
    remainingGenerations: number;
    conversionMessage: string;
    trialStatus: 'active' | 'exhausted';
  } {
    const canGenerate = FreeTrialService.canGenerate();
    const remaining = FreeTrialService.getRemainingGenerations();
    
    return {
      canGenerate,
      remainingGenerations: remaining,
      conversionMessage: FreeTrialService.getConversionMessage(),
      trialStatus: remaining > 0 ? 'active' : 'exhausted'
    };
  }

  /**
   * Check if user should see upgrade prompts
   */
  static shouldShowUpgrade(): boolean {
    const remaining = FreeTrialService.getRemainingGenerations();
    return remaining <= 1; // Show upgrade hints when 1 or 0 remaining
  }

  /**
   * Get personalized upgrade messages
   */
  static getUpgradeOptions(): Array<{
    title: string;
    description: string;
    action: 'signup' | 'api-key' | 'credits';
    priority: number;
  }> {
    const remaining = FreeTrialService.getRemainingGenerations();
    
    if (remaining === 0) {
      return [
        {
          title: 'Continue with Your API Key',
          description: 'Add your own Stability AI or OpenAI key for unlimited generations',
          action: 'api-key',
          priority: 1
        },
        {
          title: 'Try Our Credit System',
          description: 'Get 50 generations for $5 - no API key needed',
          action: 'credits',
          priority: 2
        },
        {
          title: 'Create Free Account',
          description: 'Save your creations and access community features',
          action: 'signup',
          priority: 3
        }
      ];
    } else {
      return [
        {
          title: 'Save Your Creations',
          description: 'Create a free account to keep your creatures forever',
          action: 'signup',
          priority: 1
        },
        {
          title: 'Unlimited Generations',
          description: 'Add your API key or try our credit system',
          action: 'api-key',
          priority: 2
        }
      ];
    }
  }
}