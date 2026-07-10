import { BaseAIProvider, AIProviderConfig, GenerationConfig, GenerationResponse } from './base';

export class HuggingFaceProvider extends BaseAIProvider {
  readonly config: AIProviderConfig = {
    name: 'huggingface',
    displayName: 'Hugging Face',
    description: 'Open-source models via Hugging Face Inference API',
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
        id: 'stabilityai/stable-diffusion-xl-base-1.0',
        name: 'Stable Diffusion XL',
        description: 'High-quality, versatile image generation',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 'high',
        speed: 'medium',
        style: 'general'
      },
      {
        id: 'runwayml/stable-diffusion-v1-5',
        name: 'Stable Diffusion 1.5',
        description: 'Classic stable diffusion model',
        maxWidth: 768,
        maxHeight: 768,
        quality: 'standard',
        speed: 'fast',
        style: 'general'
      },
      {
        id: 'CompVis/stable-diffusion-v1-4',
        name: 'Stable Diffusion 1.4',
        description: 'Original stable diffusion model',
        maxWidth: 512,
        maxHeight: 512,
        quality: 'standard',
        speed: 'fast',
        style: 'general'
      },
      {
        id: 'stabilityai/stable-diffusion-2-1',
        name: 'Stable Diffusion 2.1',
        description: 'Improved stable diffusion model',
        maxWidth: 768,
        maxHeight: 768,
        quality: 'standard',
        speed: 'medium',
        style: 'general'
      }
    ]
  };

  private baseUrl = 'https://api-inference.huggingface.co/models';

  isConfigured(): boolean {
    return Boolean(this.getApiKey('VITE_HUGGINGFACE_API_KEY'));
  }

  validateConfig(): { valid: boolean; error?: string } {
    const apiKey = this.getApiKey('VITE_HUGGINGFACE_API_KEY');
    
    if (!apiKey) {
      return {
        valid: false,
        error: 'Hugging Face API key is required'
      };
    }
    
    if (!apiKey.startsWith('hf_')) {
      return {
        valid: false,
        error: 'Hugging Face API key must start with "hf_"'
      };
    }
    
    return { valid: true };
  }

  async generateImage(config: GenerationConfig): Promise<GenerationResponse> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      return this.createErrorResponse(validation.error!);
    }

    const apiKey = this.getApiKey('VITE_HUGGINGFACE_API_KEY')!;
    const model = config.model || this.config.models[0].id;
    const url = `${this.baseUrl}/${model}`;

    const enhancedPrompt = this.enhancePrompt(config.prompt);

    const requestBody = {
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt: config.negativePrompt || 'blurry, low quality, distorted, deformed, mutated, ugly, disfigured, extra limbs, missing limbs, ugly, bad anatomy, poorly drawn',
        num_inference_steps: config.steps || 30,
        guidance_scale: config.guidance || 7.5,
        width: config.width || 1024,
        height: config.height || 1024,
        ...(config.seed && { seed: config.seed })
      }
    };

    console.log(`🔄 HuggingFace: Generating with model ${model}`);
    console.log(`🚀 Prompt: ${enhancedPrompt}`);

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 HuggingFace API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HuggingFace API Error:', errorText);
        
        // Check for permission errors specifically
        if (response.status === 403) {
          if (errorText.includes('sufficient permissions') || errorText.includes('Inference Providers')) {
            return this.createErrorResponse('INSUFFICIENT_PERMISSIONS: Your API key needs "Inference API" access level. Please create a new token with proper permissions.');
          }
        }
        
        return this.createErrorResponse(`HTTP ${response.status}: ${errorText}`);
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      console.log('📋 Response content-type:', contentType);
      
      if (contentType?.includes('application/json')) {
        const jsonResponse = await response.json();
        if (jsonResponse.error) {
          return this.createErrorResponse(`API Error: ${jsonResponse.error}`);
        }
        return this.createErrorResponse('Unexpected JSON response from image API');
      }

      if (contentType?.includes('image/')) {
        const blob = await response.blob();
        console.log('🖼️ Received image blob, size:', blob.size, 'bytes');
        
        const imageUrl = URL.createObjectURL(blob);
        
        const timeMs = Date.now() - startTime;
        
        return {
          success: true,
          imageUrl,
          metadata: {
            provider: this.config.name,
            model,
            seed: config.seed,
            steps: config.steps || 30,
            guidance: config.guidance || 7.5,
            timeMs
          }
        };
      }

      return this.createErrorResponse('Unexpected response format from API');

    } catch (error) {
      console.error('💥 HuggingFace generation failed:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Network error');
    }
  }

  protected enhancePrompt(prompt: string): string {
    // Add HuggingFace-specific enhancements
    const enhancements = [
      'highly detailed',
      'professional photography',
      'cinematic lighting',
      'epic composition',
      '8K resolution',
      'photorealistic',
      'digital art',
      'concept art style',
      'scientific illustration'
    ];
    
    return `${prompt}, ${enhancements.join(', ')}`;
  }
}