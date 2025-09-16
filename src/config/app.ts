/**
 * Environment configuration for the Createosaur application
 * This file manages API keys and external service configurations
 */

export interface AppConfig {
  imageGeneration: {
    provider: 'huggingface' | 'openai' | 'stability';
    apiKey?: string;
    defaultModel: string;
    fallbackToFree: boolean;
  };
  features: {
    enableImageGeneration: boolean;
    enableBatchGeneration: boolean;
    maxBatchSize: number;
    enableGallery: boolean;
  };
  ui: {
    enableAdvancedControls: boolean;
    showDebugInfo: boolean;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  imageGeneration: {
    provider: 'huggingface',
    defaultModel: 'stabilityai/stable-diffusion-xl-base-1.0',
    fallbackToFree: true,
  },
  features: {
    enableImageGeneration: true,
    enableBatchGeneration: true,
    maxBatchSize: 4,
    enableGallery: true,
  },
  ui: {
    enableAdvancedControls: true,
    showDebugInfo: false,
  },
};

// Load configuration from environment variables
const loadConfig = (): AppConfig => {
  const config = { ...defaultConfig };

  // Image generation settings
  if (import.meta.env.VITE_HUGGINGFACE_API_KEY) {
    config.imageGeneration.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  }

  if (import.meta.env.VITE_IMAGE_PROVIDER) {
    config.imageGeneration.provider = import.meta.env.VITE_IMAGE_PROVIDER as any;
  }

  if (import.meta.env.VITE_DEFAULT_MODEL) {
    config.imageGeneration.defaultModel = import.meta.env.VITE_DEFAULT_MODEL;
  }

  // Feature flags
  if (import.meta.env.VITE_ENABLE_IMAGE_GEN === 'false') {
    config.features.enableImageGeneration = false;
  }

  if (import.meta.env.VITE_MAX_BATCH_SIZE) {
    config.features.maxBatchSize = parseInt(import.meta.env.VITE_MAX_BATCH_SIZE, 10);
  }

  // UI settings
  if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
    config.ui.showDebugInfo = true;
  }

  return config;
};

export const appConfig = loadConfig();

// Utility functions
export const isImageGenerationEnabled = () => appConfig.features.enableImageGeneration;
export const getMaxBatchSize = () => appConfig.features.maxBatchSize;
export const hasApiKey = () => !!appConfig.imageGeneration.apiKey;
export const shouldShowDebugInfo = () => appConfig.ui.showDebugInfo;