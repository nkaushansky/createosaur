import { BaseAIProvider, GenerationConfig, GenerationResponse } from './base';
import { HuggingFaceProvider } from './huggingface';
import { OpenAIProvider } from './openai';
import { StabilityAIProvider } from './stability';

export class AIProviderRegistry {
  private providers: Map<string, BaseAIProvider> = new Map();
  private defaultProvider = 'huggingface';

  constructor() {
    this.registerProvider(new HuggingFaceProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new StabilityAIProvider());
  }

  private registerProvider(provider: BaseAIProvider) {
    this.providers.set(provider.config.name, provider);
  }

  getProvider(name: string): BaseAIProvider | null {
    return this.providers.get(name) || null;
  }

  getAllProviders(): BaseAIProvider[] {
    return Array.from(this.providers.values());
  }

  getConfiguredProviders(): BaseAIProvider[] {
    return this.getAllProviders().filter(provider => provider.isConfigured());
  }

  getDefaultProvider(): BaseAIProvider {
    // Try to return a configured provider, fallback to HuggingFace
    const configuredProviders = this.getConfiguredProviders();
    if (configuredProviders.length > 0) {
      return configuredProviders[0];
    }
    
    return this.providers.get(this.defaultProvider)!;
  }

  setDefaultProvider(name: string): boolean {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
      localStorage.setItem('createosaur-default-provider', name);
      return true;
    }
    return false;
  }

  getDefaultProviderName(): string {
    return localStorage.getItem('createosaur-default-provider') || this.defaultProvider;
  }

  async generateWithFallback(config: GenerationConfig): Promise<GenerationResponse> {
    const preferredProviderName = config.provider || this.getDefaultProviderName();
    const preferredProvider = this.getProvider(preferredProviderName);
    
    // Try preferred provider first
    if (preferredProvider && preferredProvider.isConfigured()) {
      console.log(`🎯 Trying preferred provider: ${preferredProvider.config.displayName}`);
      
      try {
        const result = await preferredProvider.generateImage(config);
        if (result.success) {
          return result;
        }
        
        console.warn(`⚠️ Preferred provider failed: ${result.error}`);
      } catch (error) {
        console.warn(`⚠️ Preferred provider crashed:`, error);
      }
    }

    // Try all other configured providers as fallbacks
    const fallbackProviders = this.getConfiguredProviders()
      .filter(p => p.config.name !== preferredProviderName);

    for (const provider of fallbackProviders) {
      console.log(`🔄 Trying fallback provider: ${provider.config.displayName}`);
      
      try {
        const result = await provider.generateImage(config);
        if (result.success) {
          console.log(`✅ Fallback provider succeeded: ${provider.config.displayName}`);
          return result;
        }
        
        console.warn(`⚠️ Fallback provider failed: ${result.error}`);
      } catch (error) {
        console.warn(`⚠️ Fallback provider crashed:`, error);
      }
    }

    // If all providers fail, return an error
    return {
      success: false,
      error: 'All configured AI providers failed to generate image',
      metadata: {
        provider: 'none',
        model: 'none'
      }
    };
  }

  // Get available models for a specific provider
  getModelsForProvider(providerName: string) {
    const provider = this.getProvider(providerName);
    return provider ? provider.config.models : [];
  }

  // Get all available models across all providers
  getAllModels() {
    const models: any[] = [];
    this.getAllProviders().forEach(provider => {
      provider.config.models.forEach(model => {
        models.push({
          ...model,
          provider: provider.config.name,
          providerDisplayName: provider.config.displayName
        });
      });
    });
    return models;
  }
}

// Export singleton instance
export const aiProviderRegistry = new AIProviderRegistry();