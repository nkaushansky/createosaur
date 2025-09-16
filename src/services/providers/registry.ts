import { BaseAIProvider, GenerationConfig, GenerationResponse } from './base';
import { HuggingFaceProvider } from './huggingface';
import { OpenAIProvider } from './openai';
import { StabilityAIProvider } from './stability';
import { ModelMapper, EnhancedGenerationConfig } from './modelMapping';

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

  /**
   * Prepare generation config for a specific provider by mapping models appropriately
   */
  private prepareConfigForProvider(config: GenerationConfig, providerName: string): GenerationConfig {
    const enhancedConfig = { ...config };
    
    if (config.model) {
      try {
        // If a specific model is requested, try to map it to the provider's format
        const capability = ModelMapper.detectCapabilityFromLegacyModel(config.model);
        const providerModel = ModelMapper.getModelForProvider(providerName, capability);
        enhancedConfig.model = providerModel;
      } catch (error) {
        console.warn(`⚠️ Could not map model for ${providerName}, using default:`, error);
        // Fallback: let the provider use its default model
        delete enhancedConfig.model;
      }
    }
    
    return enhancedConfig;
  }

  async generateWithFallback(config: GenerationConfig): Promise<GenerationResponse> {
    const preferredProviderName = config.provider || this.getDefaultProviderName();
    const preferredProvider = this.getProvider(preferredProviderName);
    
    // Smart model mapping: convert legacy model IDs to provider-specific IDs
    const enhancedConfig = this.prepareConfigForProvider(config, preferredProviderName);
    
    // Try preferred provider first
    if (preferredProvider && preferredProvider.isConfigured()) {
      console.log(`🎯 Trying preferred provider: ${preferredProvider.config.displayName}`);
      console.log(`🔧 Using model: ${enhancedConfig.model} for ${preferredProviderName}`);
      
      try {
        const result = await preferredProvider.generateImage(enhancedConfig);
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
      
      // Prepare config specifically for this fallback provider
      const fallbackConfig = this.prepareConfigForProvider(config, provider.config.name);
      console.log(`🔧 Using model: ${fallbackConfig.model} for ${provider.config.name}`);
      
      try {
        const result = await provider.generateImage(fallbackConfig);
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