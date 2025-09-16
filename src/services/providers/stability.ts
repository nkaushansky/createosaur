import { BaseAIProvider, AIProviderConfig, GenerationConfig, GenerationResponse } from './base';

interface StabilityAPIRequest {
  text_prompts: Array<{
    text: string;
    weight: number;
  }>;
  cfg_scale: number;
  steps: number;
  width: number;
  height: number;
  samples: number;
  seed?: number;
}

export class StabilityAIProvider extends BaseAIProvider {
  readonly config: AIProviderConfig = {
    name: 'stability',
    displayName: 'Stability AI',
    description: 'Direct Stability AI API with latest models',
    requiresApiKey: true,
    supportedFeatures: {
      negativePrompt: true,
      steps: true,
      guidance: true,
      seeds: true,
      customDimensions: true,
    },
    models: [
      {
        id: 'stable-diffusion-xl-1024-v1-0',
        name: 'SDXL 1.0',
        description: 'Latest Stable Diffusion XL model with exceptional quality',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 'premium',
        speed: 'medium',
        style: 'general'
      },
      {
        id: 'stable-diffusion-v1-6',
        name: 'SD 1.6',
        description: 'Fast and reliable Stable Diffusion model',
        maxWidth: 768,
        maxHeight: 768,
        quality: 'high',
        speed: 'fast',
        style: 'general'
      },
      {
        id: 'stable-diffusion-512-v2-1',
        name: 'SD 2.1',
        description: 'Improved Stable Diffusion with better coherence',
        maxWidth: 768,
        maxHeight: 768,
        quality: 'high',
        speed: 'fast',
        style: 'general'
      }
    ]
  };

  private baseUrl = 'https://api.stability.ai/v1/generation';

  isConfigured(): boolean {
    return Boolean(this.getApiKey('VITE_STABILITY_API_KEY'));
  }

  validateConfig(): { valid: boolean; error?: string } {
    const apiKey = this.getApiKey('VITE_STABILITY_API_KEY');
    
    if (!apiKey) {
      return {
        valid: false,
        error: 'Stability AI API key is required'
      };
    }
    
    if (!apiKey.startsWith('sk-')) {
      return {
        valid: false,
        error: 'Stability AI API key must start with "sk-"'
      };
    }
    
    return { valid: true };
  }

  async generateImage(config: GenerationConfig): Promise<GenerationResponse> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      return this.createErrorResponse(validation.error!);
    }

    const apiKey = this.getApiKey('VITE_STABILITY_API_KEY')!;
    const model = config.model || this.config.models[0].id;
    const url = `${this.baseUrl}/${model}/text-to-image`;

    const enhancedPrompt = this.enhancePrompt(config.prompt);

    // Stability AI v1 REST API expects JSON format
    const requestBody: StabilityAPIRequest = {
      text_prompts: [
        {
          text: enhancedPrompt,
          weight: 1
        }
      ],
      cfg_scale: config.guidance || 7.5,
      steps: config.steps || 30,
      width: config.width || 1024,
      height: config.height || 1024,
      samples: 1
    };

    // Add negative prompt if provided
    if (config.negativePrompt) {
      requestBody.text_prompts.push({
        text: config.negativePrompt,
        weight: -1
      });
    }

    // Add seed if provided
    if (config.seed) {
      requestBody.seed = config.seed;
    }

    console.log(`🔄 Stability AI: Generating with model ${model}`);
    console.log(`🚀 Prompt: ${enhancedPrompt}`);

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Stability AI API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Stability AI API Error:', errorData);
        
        if (response.status === 401) {
          return this.createErrorResponse('Invalid Stability AI API key');
        }
        
        if (response.status === 429) {
          return this.createErrorResponse('Rate limit exceeded. Please wait and try again.');
        }
        
        if (response.status === 400) {
          const message = errorData.message || 'Bad request';
          return this.createErrorResponse(`Invalid parameters: ${message}`);
        }
        
        return this.createErrorResponse(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.artifacts || data.artifacts.length === 0) {
        return this.createErrorResponse('No image generated');
      }

      const artifact = data.artifacts[0];
      
      if (artifact.finishReason !== 'SUCCESS') {
        return this.createErrorResponse(`Generation failed: ${artifact.finishReason}`);
      }

      // Convert base64 to blob URL
      const base64Data = artifact.base64;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(blob);
      
      const timeMs = Date.now() - startTime;
      
      console.log('✅ Stability AI generation successful');

      return {
        success: true,
        imageUrl,
        metadata: {
          provider: this.config.name,
          model,
          seed: artifact.seed,
          steps: config.steps || 30,
          guidance: config.guidance || 7.5,
          timeMs,
          cost: this.estimateCost(config.width || 1024, config.height || 1024)
        }
      };

    } catch (error) {
      console.error('💥 Stability AI generation failed:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Network error');
    }
  }

  protected enhancePrompt(prompt: string): string {
    // Stability AI works well with detailed, technical prompts
    const enhancements = [
      'highly detailed',
      'photorealistic',
      'professional photography',
      'cinematic lighting',
      '8k resolution',
      'masterpiece',
      'best quality'
    ];
    
    return `${prompt}, ${enhancements.join(', ')}`;
  }

  private estimateCost(width: number, height: number): number {
    // Stability AI pricing is based on resolution
    const totalPixels = width * height;
    
    if (totalPixels <= 262144) { // 512x512
      return 0.002;
    } else if (totalPixels <= 589824) { // 768x768
      return 0.003;
    } else if (totalPixels <= 1048576) { // 1024x1024
      return 0.004;
    } else {
      return 0.006;
    }
  }
}