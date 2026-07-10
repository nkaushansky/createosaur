import { imageGenerationService } from './imageGeneration';

/**
 * Diagnostic utility for testing image generation
 */
export class GenerationDiagnostics {
  
  /**
   * Test basic API connectivity
   */
  static async testApiConnection(): Promise<void> {
    console.log('🧪 Starting API connectivity test...');
    
    try {
      // Test with a very simple prompt
      const result = await imageGenerationService.generateImage({
        prompt: 'a simple red circle on white background',
        steps: 10,
        width: 512,
        height: 512
      });
      
      if (result.success) {
        console.log('✅ API test successful!');
        console.log('   Image URL length:', result.imageUrl?.length);
        console.log('   Metadata:', result.metadata);
      } else {
        console.error('❌ API test failed:', result.error);
      }
      
    } catch (error) {
      console.error('💥 API test crashed:', error);
    }
  }
  
  /**
   * Test generation with a dinosaur-like prompt
   */
  static async testDinosaurGeneration(): Promise<void> {
    console.log('🦕 Testing dinosaur generation...');
    
    try {
      const result = await imageGenerationService.generateImage({
        prompt: 'A prehistoric dinosaur creature, T-rex features, realistic, detailed',
        steps: 20,
        width: 1024,
        height: 1024
      });
      
      if (result.success) {
        console.log('✅ Dinosaur generation successful!');
        console.log('   Image size:', result.imageUrl?.length, 'characters');
      } else {
        console.error('❌ Dinosaur generation failed:', result.error);
      }
      
    } catch (error) {
      console.error('💥 Dinosaur generation crashed:', error);
    }
  }
  
  /**
   * Check if we're in a browser environment with proper fetch support
   */
  static async checkEnvironment(): Promise<void> {
    console.log('🌍 Checking environment...');
    
    // Check fetch API
    if (typeof fetch === 'undefined') {
      console.error('❌ Fetch API not available');
      return;
    } else {
      console.log('✅ Fetch API available');
    }
    
    // Check for CORS issues by testing a simple request
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        console.log('✅ CORS requests working');
      } else {
        console.warn('⚠️ CORS test failed, status:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ CORS test error:', error);
    }
    
    // Check environment variables
    const hasApiKey = !!import.meta.env.VITE_HUGGINGFACE_API_KEY;
    console.log('🔑 API Key configured:', hasApiKey);
    
    if (hasApiKey) {
      const keyLength = import.meta.env.VITE_HUGGINGFACE_API_KEY?.length || 0;
      console.log('   Key length:', keyLength, 'characters');
    }
  }
  
  /**
   * Run all diagnostic tests
   */
  static async runFullDiagnostics(): Promise<void> {
    console.log('🩺 Running full diagnostics...');
    console.log('='.repeat(50));
    
    await this.checkEnvironment();
    console.log('-'.repeat(30));
    
    await this.testApiConnection();
    console.log('-'.repeat(30));
    
    await this.testDinosaurGeneration();
    console.log('='.repeat(50));
    console.log('🏁 Diagnostics complete');
  }
}

// Export for use in console debugging
if (typeof window !== 'undefined') {
  (window as any).generateDiagnostics = GenerationDiagnostics;
}