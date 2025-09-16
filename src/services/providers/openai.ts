import { BaseAIProvider, AIProviderConfig, GenerationConfig, GenerationResponse } from './base';

export class OpenAIProvider extends BaseAIProvider {
  readonly config: AIProviderConfig = {
    name: 'openai',
    displayName: 'OpenAI DALL-E',
    description: 'Premium AI image generation by OpenAI',
    requiresApiKey: true,
    supportedFeatures: {
      negativePrompt: false, // DALL-E doesn't support negative prompts
      steps: false, // DALL-E doesn't expose steps
      guidance: false, // DALL-E doesn't expose guidance
      seeds: false, // DALL-E doesn't support seeds
      customDimensions: true, // Limited size options
    },
    models: [
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        description: 'Latest and most advanced DALL-E model with exceptional quality',
        maxWidth: 1792,
        maxHeight: 1792,
        quality: 'premium',
        speed: 'slow',
        style: 'artistic'
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        description: 'Previous generation DALL-E with good quality and faster speed',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 'high',
        speed: 'medium',
        style: 'artistic'
      }
    ]
  };

  private baseUrl = 'https://api.openai.com/v1/images/generations';

  isConfigured(): boolean {
    return Boolean(this.getApiKey('VITE_OPENAI_API_KEY'));
  }

  validateConfig(): { valid: boolean; error?: string } {
    const apiKey = this.getApiKey('VITE_OPENAI_API_KEY');
    
    if (!apiKey) {
      return {
        valid: false,
        error: 'OpenAI API key is required'
      };
    }
    
    if (!apiKey.startsWith('sk-')) {
      return {
        valid: false,
        error: 'OpenAI API key must start with "sk-"'
      };
    }
    
    return { valid: true };
  }

  async generateImage(config: GenerationConfig): Promise<GenerationResponse> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      return this.createErrorResponse(validation.error!);
    }

    const apiKey = this.getApiKey('VITE_OPENAI_API_KEY')!;
    const model = config.model || 'dall-e-3';

    // DALL-E has specific size requirements
    const size = this.getDalleSize(config.width, config.height, model);
    const enhancedPrompt = this.enhancePrompt(config.prompt);

    const requestBody: any = {
      model,
      prompt: enhancedPrompt,
      n: 1,
      size,
      response_format: 'url'
    };

    // DALL-E 3 specific options
    if (model === 'dall-e-3') {
      requestBody.quality = 'hd';
      requestBody.style = 'natural'; // or 'vivid'
    }

    console.log(`🔄 OpenAI: Generating with DALL-E model ${model}`);
    console.log(`🚀 Prompt: ${enhancedPrompt}`);

    const startTime = Date.now();

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 OpenAI API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ OpenAI API Error:', errorData);
        
        if (response.status === 401) {
          return this.createErrorResponse('Invalid OpenAI API key');
        }
        
        if (response.status === 429) {
          return this.createErrorResponse('Rate limit exceeded. Please wait and try again.');
        }
        
        if (response.status === 400 && errorData.error?.code === 'content_policy_violation') {
          return this.createErrorResponse('Content policy violation. Please modify your prompt.');
        }
        
        return this.createErrorResponse(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return this.createErrorResponse('No image generated');
      }

      const imageUrl = data.data[0].url;
      const timeMs = Date.now() - startTime;
      
      console.log('✅ OpenAI generation successful');

      return {
        success: true,
        imageUrl,
        metadata: {
          provider: this.config.name,
          model,
          timeMs,
          cost: this.estimateCost(model, size)
        }
      };

    } catch (error) {
      console.error('💥 OpenAI generation failed:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Network error');
    }
  }

  protected enhancePrompt(prompt: string): string {
    // DALL-E works best with descriptive, detailed prompts
    // But doesn't need technical photography terms as much
    return `${prompt}, highly detailed digital artwork, premium quality, professional illustration`;
  }

  private getDalleSize(width?: number, height?: number, model?: string): string {
    // DALL-E has specific size options
    const targetWidth = width || 1024;
    const targetHeight = height || 1024;
    
    if (model === 'dall-e-3') {
      // DALL-E 3 size options: 1024x1024, 1024x1792, 1792x1024
      if (targetWidth > targetHeight) {
        return '1792x1024';
      } else if (targetHeight > targetWidth) {
        return '1024x1792';
      } else {
        return '1024x1024';
      }
    } else {
      // DALL-E 2 size options: 256x256, 512x512, 1024x1024
      if (targetWidth <= 256 && targetHeight <= 256) {
        return '256x256';
      } else if (targetWidth <= 512 && targetHeight <= 512) {
        return '512x512';
      } else {
        return '1024x1024';
      }
    }
  }

  private estimateCost(model: string, size: string): number {
    // Approximate costs in USD (as of 2024)
    const costs: Record<string, Record<string, number>> = {
      'dall-e-3': {
        '1024x1024': 0.040,
        '1024x1792': 0.080,
        '1792x1024': 0.080
      },
      'dall-e-2': {
        '256x256': 0.016,
        '512x512': 0.018,
        '1024x1024': 0.020
      }
    };
    
    return costs[model]?.[size] || 0;
  }
}