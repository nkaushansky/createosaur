// Base interfaces for all AI providers
/**
 * Core interfaces and base classes for AI provider system
 * 
 * This module defines the common interfaces that all AI providers must implement,
 * ensuring consistent behavior across different AI services (HuggingFace, OpenAI, etc.)
 */

/**
 * Configuration interface for AI provider metadata and capabilities
 */
export interface AIProviderConfig {
  name: string;           // Internal identifier (e.g., 'openai', 'huggingface')
  displayName: string;    // Human-readable name (e.g., 'OpenAI DALL-E')
  description: string;    // Brief description of the provider's capabilities
  requiresApiKey: boolean; // Whether this provider needs API authentication
  supportedFeatures: {
    negativePrompt: boolean;    // Supports negative prompting
    steps: boolean;             // Supports custom step count
    guidance: boolean;          // Supports guidance scale
    seeds: boolean;             // Supports deterministic seeds
    customDimensions: boolean;  // Supports custom width/height
  };
  models: AIModel[];      // Available models for this provider
}

/**
 * Model configuration for specific AI models within a provider
 */
export interface AIModel {
  id: string;                                    // Model identifier for API calls
  name: string;                                  // Display name for UI
  description: string;                           // Model capabilities description
  maxWidth: number;                              // Maximum supported width
  maxHeight: number;                             // Maximum supported height
  quality: 'standard' | 'high' | 'premium';     // Quality tier
  speed: 'fast' | 'medium' | 'slow';            // Generation speed
  style: 'realistic' | 'artistic' | 'anime' | 'general'; // Model style specialty
}

/**
 * Input configuration for image generation requests
 */
export interface GenerationConfig {
  prompt: string;          // Main generation prompt (required)
  model?: string;          // Specific model to use (optional)
  negativePrompt?: string; // What to avoid in generation
  steps?: number;          // Number of diffusion steps
  guidance?: number;       // Guidance scale for prompt adherence
  width?: number;          // Output image width
  height?: number;         // Output image height
  seed?: number;           // Deterministic seed for reproducible results
  provider?: string;       // Preferred provider for this generation
}

/**
 * Response from image generation including metadata
 */
export interface GenerationResponse {
  success: boolean;        // Whether generation succeeded
  imageUrl?: string;       // Base64 data URL or external URL of generated image
  error?: string;          // Error message if generation failed
  metadata?: {
    provider: string;      // Provider that generated the image
    model: string;         // Model used for generation
    seed?: number;         // Seed used (if supported)
    steps?: number;        // Steps used
    guidance?: number;     // Guidance scale used
    cost?: number;         // Generation cost in credits/USD
    timeMs?: number;       // Generation time in milliseconds
  };
}

/**
 * Abstract base class for all AI providers
 * 
 * Provides common functionality and enforces implementation of required methods.
 * All concrete providers (HuggingFace, OpenAI, etc.) must extend this class.
 */

export abstract class BaseAIProvider {
  /**
   * Provider configuration including models, features, and metadata
   * Must be implemented by each concrete provider
   */
  abstract readonly config: AIProviderConfig;
  
  /**
   * Check if this provider has valid configuration (API keys, etc.)
   * @returns True if provider is ready to generate images
   */
  abstract isConfigured(): boolean;
  
  /**
   * Validate the current provider configuration
   * @returns Validation result with specific error if invalid
   */
  abstract validateConfig(): { valid: boolean; error?: string };
  
  /**
   * Generate an image using this provider's API
   * @param config - Generation parameters
   * @returns Promise resolving to generation response
   */
  abstract generateImage(config: GenerationConfig): Promise<GenerationResponse>;
  
  /**
   * Helper method to securely retrieve API keys from localStorage or environment
   * @param keyName - Name of the environment variable or localStorage key
   * @returns API key string or null if not found
   */
  protected getApiKey(keyName: string): string | null {
    return localStorage.getItem(keyName) || 
           import.meta.env[keyName] || 
           null;
  }
  
  /**
   * Helper method to create standardized error responses
   * @param error - Error message to include in response
   * @returns Formatted error response
   */
  protected createErrorResponse(error: string): GenerationResponse {
    return {
      success: false,
      error,
      metadata: {
        provider: this.config.name,
        model: 'unknown'
      }
    };
  }
  
  /**
   * Provider-specific prompt enhancement
   * Override in subclasses to add provider-specific optimizations
   * @param prompt - Original user prompt
   * @returns Enhanced prompt optimized for this provider
   */
  protected enhancePrompt(prompt: string): string {
    // Base implementation - providers can override
    return prompt;
  }
}