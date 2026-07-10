import { aiProviderRegistry } from './providers';
import { GenerationConfig, GenerationResponse } from './providers/base';
import { MockImageGenerationService } from './mockImageGeneration';

// Re-export types for backward compatibility
export type { GenerationConfig, GenerationResponse };

/**
 * Main image generation service that orchestrates multiple AI providers
 * 
 * This service provides a unified interface for AI image generation across
 * multiple providers (HuggingFace, OpenAI, Stability AI) with automatic
 * fallback capabilities and demo mode support.
 * 
 * Features:
 * - Multi-provider support with automatic failover
 * - Demo mode with SVG generation when no providers configured
 * - Batch generation capabilities
 * - Provider preference management
 * - Comprehensive error handling
 * 
 * @example
 * ```typescript
 * const result = await imageGenerationService.generateImage({
 *   prompt: "A majestic T-Rex in a forest",
 *   model: "stable-diffusion-xl",
 *   steps: 20,
 *   width: 1024,
 *   height: 1024
 * });
 * ```
 */
class ImageGenerationService {
  private mockService = new MockImageGenerationService();

  /**
   * Generate a single image using the configured AI providers
   * 
   * Automatically detects available providers and uses the provider registry's
   * fallback system. If no providers are configured, falls back to demo mode
   * with SVG generation.
   * 
   * @param config - Generation configuration including prompt, dimensions, etc.
   * @returns Promise resolving to generation response with image URL or error
   */
  async generateImage(config: GenerationConfig): Promise<GenerationResponse> {
    // Check if we have any configured providers
    const configuredProviders = aiProviderRegistry.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      console.log('🎭 No AI providers configured, using demo mode');
      
      // Use mock service for demo mode
      const mockResult = await this.mockService.generateMockImage(config.prompt);
      return {
        success: mockResult.success,
        imageUrl: mockResult.imageUrl || '',
        error: mockResult.error,
        metadata: {
          provider: 'demo',
          model: 'svg-generator',
          ...mockResult.metadata
        }
      };
    }

    // Use the provider registry for real AI generation
    return await aiProviderRegistry.generateWithFallback(config);
  }

  /**
   * Generate multiple images with the same configuration
   * 
   * Processes each generation request sequentially to avoid overwhelming
   * API rate limits. Each generation uses the full fallback system.
   * 
   * @param configs - Array of generation configurations
   * @returns Promise resolving to array of generation responses
   */
  async generateBatch(configs: GenerationConfig[]): Promise<GenerationResponse[]> {
    const results: GenerationResponse[] = [];
    
    for (const config of configs) {
      try {
        const result = await this.generateImage(config);
        results.push(result);
      } catch (error) {
        console.error('Batch generation error:', error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            provider: 'unknown',
            model: 'unknown'
          }
        });
      }
    }
    
    return results;
  }

  // === Provider Management Utilities ===

  /**
   * Get all available AI providers regardless of configuration status
   * @returns Array of all registered providers
   */
  getAvailableProviders() {
    return aiProviderRegistry.getAllProviders();
  }

  /**
   * Get only providers that have valid API keys configured
   * @returns Array of configured providers ready for use
   */
  getConfiguredProviders() {
    return aiProviderRegistry.getConfiguredProviders();
  }

  /**
   * Set the preferred provider for new generations
   * @param providerName - Name of the provider to set as default
   * @returns True if provider exists and was set successfully
   */
  setDefaultProvider(providerName: string) {
    return aiProviderRegistry.setDefaultProvider(providerName);
  }

  /**
   * Get the current default provider instance
   * @returns The currently configured default provider
   */
  getDefaultProvider() {
    return aiProviderRegistry.getDefaultProvider();
  }

  /**
   * Get all available models across all providers
   * @returns Array of models with provider information
   */
  getAllModels() {
    return aiProviderRegistry.getAllModels();
  }

  /**
   * Get available models for a specific provider
   * @param providerName - Name of the provider to query
   * @returns Array of models for the specified provider
   */
  getModelsForProvider(providerName: string) {
    return aiProviderRegistry.getModelsForProvider(providerName);
  }
}

/**
 * Singleton instance of the image generation service
 * 
 * Use this instance throughout the application for consistent
 * provider management and configuration.
 */
export const imageGenerationService = new ImageGenerationService();