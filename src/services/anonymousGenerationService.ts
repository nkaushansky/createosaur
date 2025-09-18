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
      // Get user fingerprint and session for server verification
      const fingerprint = this.getUserFingerprint();
      const sessionId = this.getSessionId();
      
      // Call secure server-side API
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          fingerprint,
          sessionId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Generation failed',
          remainingGenerations: result.remainingGenerations || 0,
          trialStatus: result.remainingGenerations > 0 ? 'active' : 'exhausted',
          conversionMessage: FreeTrialService.getConversionMessage()
        };
      }

      // Update local trial tracking to match server
      try {
        FreeTrialService.syncWithServer(result.totalUsed, result.maxAllowed);
      } catch (e) {
        console.warn('Failed to sync trial data:', e);
      }

      return {
        success: true,
        imageUrl: result.imageUrl,
        remainingGenerations: result.remainingGenerations,
        trialStatus: result.remainingGenerations > 0 ? 'active' : 'exhausted',
        conversionMessage: FreeTrialService.getConversionMessage()
      };
      
    } catch (error) {
      console.error('Anonymous generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        remainingGenerations: FreeTrialService.getRemainingGenerations(),
        trialStatus: 'active',
        conversionMessage: FreeTrialService.getConversionMessage()
      };
    }
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

  /**
   * Get user fingerprint for server verification
   */
  private static getUserFingerprint(): string {
    // Use the same fingerprinting logic as FreeTrialService
    try {
      const fp = {
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: new Date().getTimezoneOffset(),
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        canvas: this.getCanvasFingerprint(),
        webgl: this.getWebGLFingerprint()
      };
      
      return this.simpleHash(JSON.stringify(fp));
    } catch (e) {
      return 'fingerprint-error';
    }
  }

  /**
   * Get session ID
   */
  private static getSessionId(): string {
    const sessionKey = 'createosaur_session';
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(sessionKey, sessionId);
    }
    return sessionId;
  }

  /**
   * Canvas fingerprinting
   */
  private static getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Createosaur fingerprint', 2, 2);
      
      return canvas.toDataURL().slice(-50);
    } catch (e) {
      return 'canvas-error';
    }
  }

  /**
   * WebGL fingerprinting
   */
  private static getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
      if (!gl) return 'no-webgl';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return 'no-debug-info';
      
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      return this.simpleHash(`${vendor}|${renderer}`).slice(-10);
    } catch (e) {
      return 'webgl-error';
    }
  }

  /**
   * Simple hash function
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
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
}