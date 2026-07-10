/**
 * Model mapping system for cross-provider compatibility
 * 
 * This system allows users to request models by capability/quality level
 * and automatically maps to the correct provider-specific model ID.
 */

export interface ModelCapability {
  id: string;
  name: string;
  description: string;
  quality: 'standard' | 'high' | 'premium';
  speed: 'fast' | 'medium' | 'slow';
  maxResolution: number;
  capabilities: string[];
}

export interface ProviderModelMapping {
  [providerName: string]: {
    [capabilityId: string]: string; // maps capability ID to provider-specific model ID
  };
}

/**
 * Universal model capabilities - provider-agnostic model types
 */
export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  'sdxl-premium': {
    id: 'sdxl-premium',
    name: 'Stable Diffusion XL (Premium)',
    description: 'High-quality, latest SDXL model with excellent detail',
    quality: 'premium',
    speed: 'medium',
    maxResolution: 1024,
    capabilities: ['high-detail', 'large-resolution', 'photorealistic']
  },
  'sd-fast': {
    id: 'sd-fast',
    name: 'Stable Diffusion (Fast)',
    description: 'Quick generation with good quality',
    quality: 'high',
    speed: 'fast',
    maxResolution: 768,
    capabilities: ['fast-generation', 'versatile']
  },
  'dalle-premium': {
    id: 'dalle-premium',
    name: 'DALL-E 3 (Premium)',
    description: 'OpenAI\'s latest image generation model',
    quality: 'premium',
    speed: 'medium',
    maxResolution: 1024,
    capabilities: ['text-rendering', 'complex-scenes', 'artistic']
  }
};

/**
 * Maps universal capability IDs to provider-specific model IDs
 */
export const PROVIDER_MODEL_MAPPING: ProviderModelMapping = {
  'stability': {
    'sdxl-premium': 'stable-diffusion-xl-1024-v1-0',
    'sd-fast': 'stable-diffusion-v1-6',
    'dalle-premium': 'stable-diffusion-xl-1024-v1-0', // fallback to best available
  },
  'huggingface': {
    'sdxl-premium': 'stabilityai/stable-diffusion-xl-base-1.0',
    'sd-fast': 'runwayml/stable-diffusion-v1-5',
    'dalle-premium': 'stabilityai/stable-diffusion-xl-base-1.0', // fallback
  },
  'openai': {
    'sdxl-premium': 'dall-e-3', // OpenAI doesn't have SDXL, use best available
    'sd-fast': 'dall-e-2',
    'dalle-premium': 'dall-e-3',
  }
};

/**
 * Model mapper utility class
 */
export class ModelMapper {
  /**
   * Get the best model for a provider based on capability requirements
   */
  static getModelForProvider(
    providerName: string, 
    requestedCapability: string = 'sdxl-premium'
  ): string {
    const mapping = PROVIDER_MODEL_MAPPING[providerName];
    if (!mapping) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    // Try to find exact capability match
    if (mapping[requestedCapability]) {
      return mapping[requestedCapability];
    }

    // Fallback to best available model for this provider
    const capabilities = Object.keys(mapping);
    if (capabilities.length === 0) {
      throw new Error(`No models configured for provider: ${providerName}`);
    }

    // Return the first (presumably best) model as fallback
    return mapping[capabilities[0]];
  }

  /**
   * Convert a legacy model ID to the universal capability system
   */
  static detectCapabilityFromLegacyModel(legacyModelId: string): string {
    // Map common legacy model IDs to capabilities
    const legacyMappings: Record<string, string> = {
      'stabilityai/stable-diffusion-xl-base-1.0': 'sdxl-premium',
      'stable-diffusion-xl-1024-v1-0': 'sdxl-premium',
      'runwayml/stable-diffusion-v1-5': 'sd-fast',
      'stable-diffusion-v1-6': 'sd-fast',
      'dall-e-3': 'dalle-premium',
      'dall-e-2': 'sd-fast',
    };

    return legacyMappings[legacyModelId] || 'sdxl-premium';
  }

  /**
   * Get all available capabilities for a provider
   */
  static getAvailableCapabilities(providerName: string): ModelCapability[] {
    const mapping = PROVIDER_MODEL_MAPPING[providerName];
    if (!mapping) return [];

    return Object.keys(mapping)
      .map(capId => MODEL_CAPABILITIES[capId])
      .filter(Boolean);
  }

  /**
   * Find the best provider for a specific capability
   */
  static getBestProviderForCapability(
    capability: string, 
    availableProviders: string[]
  ): string | null {
    for (const provider of availableProviders) {
      const mapping = PROVIDER_MODEL_MAPPING[provider];
      if (mapping && mapping[capability]) {
        return provider;
      }
    }
    return null;
  }
}

/**
 * Enhanced generation config that supports both legacy and capability-based models
 */
export interface EnhancedGenerationConfig {
  prompt: string;
  
  // Legacy support - if specified, will be converted to capability
  model?: string;
  
  // New capability-based system
  capability?: string;
  quality?: 'standard' | 'high' | 'premium';
  speed?: 'fast' | 'medium' | 'slow';
  
  // Standard generation params
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  negativePrompt?: string;
  seed?: number;
  provider?: string;
}