/**
 * Free Trial System with Progressive Friction
 * Tracks anonymous usage and provides smooth conversion paths
 */

interface TrialUsage {
  generationsUsed: number;
  maxGenerations: number;
  lastUsed: string;
  fingerprint: string;
  sessionId: string;
}

export class FreeTrialService {
  private static readonly STORAGE_KEY = 'createosaur_trial';
  private static readonly SESSION_KEY = 'createosaur_session';
  private static readonly INITIAL_LIMIT = 3;
  private static readonly REPEAT_LIMIT = 2;
  private static readonly FINAL_LIMIT = 1;

  /**
   * Get current trial status for user
   */
  static getTrialStatus(): TrialUsage {
    const fingerprint = this.generateFingerprint();
    const sessionId = this.getOrCreateSession();
    
    // Try to get existing usage
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const usage: TrialUsage = JSON.parse(stored);
        
        // Check if fingerprint matches (same device/browser)
        if (usage.fingerprint === fingerprint) {
          return usage;
        }
        
        // Different fingerprint - apply progressive friction
        const previousUsage = usage.generationsUsed;
        let maxGenerations = this.INITIAL_LIMIT;
        
        if (previousUsage >= this.INITIAL_LIMIT) {
          maxGenerations = this.REPEAT_LIMIT;
        }
        if (previousUsage >= this.INITIAL_LIMIT + this.REPEAT_LIMIT) {
          maxGenerations = this.FINAL_LIMIT;
        }
        
        return {
          generationsUsed: 0,
          maxGenerations,
          lastUsed: new Date().toISOString(),
          fingerprint,
          sessionId
        };
      } catch (e) {
        console.warn('Invalid trial data, resetting');
      }
    }
    
    // New user - full trial
    return {
      generationsUsed: 0,
      maxGenerations: this.INITIAL_LIMIT,
      lastUsed: new Date().toISOString(),
      fingerprint,
      sessionId
    };
  }

  /**
   * Check if user can generate more creatures
   */
  static canGenerate(): boolean {
    const status = this.getTrialStatus();
    return status.generationsUsed < status.maxGenerations;
  }

  /**
   * Record a generation attempt
   */
  static recordGeneration(): TrialUsage {
    const status = this.getTrialStatus();
    
    if (status.generationsUsed >= status.maxGenerations) {
      throw new Error('Trial limit exceeded');
    }
    
    const updated: TrialUsage = {
      ...status,
      generationsUsed: status.generationsUsed + 1,
      lastUsed: new Date().toISOString()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Sync local data with server response
   */
  static syncWithServer(serverUsed: number, serverMax: number): void {
    const status = this.getTrialStatus();
    const updated: TrialUsage = {
      ...status,
      generationsUsed: serverUsed,
      maxGenerations: serverMax,
      lastUsed: new Date().toISOString()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Get remaining generations
   */
  static getRemainingGenerations(): number {
    const status = this.getTrialStatus();
    return Math.max(0, status.maxGenerations - status.generationsUsed);
  }

  /**
   * Get conversion message based on usage
   */
  static getConversionMessage(): string {
    const status = this.getTrialStatus();
    const remaining = this.getRemainingGenerations();
    
    if (remaining === 0) {
      return "You've explored our AI-powered creature creation! Ready to create unlimited creatures?";
    }
    
    if (remaining === 1) {
      return `One more free generation! After that, you can continue with your own API key or try our credit system.`;
    }
    
    if (status.maxGenerations === this.REPEAT_LIMIT || status.maxGenerations === this.FINAL_LIMIT) {
      return `Welcome back! You have ${remaining} free generations on this device.`;
    }
    
    return `Welcome! You have ${remaining} free generations to explore creature creation.`;
  }

  /**
   * Generate browser fingerprint for tracking
   */
  private static generateFingerprint(): string {
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
   * Get or create session ID
   */
  private static getOrCreateSession(): string {
    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  /**
   * Canvas fingerprinting for device identification
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
   * Simple hash function for fingerprinting
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
   * Clear trial data (for testing)
   */
  static clearTrialData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  }
}
