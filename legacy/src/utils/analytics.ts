/**
 * Custom Analytics & Event Tracking System
 * Tracks user interactions, feature usage, and conversion funnels
 */

interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  customData?: Record<string, any>;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: AnalyticsEvent[];
  userAgent: string;
  referrer: string;
}

class CreatosaurAnalytics {
  private sessionId: string;
  private session: UserSession;
  private eventQueue: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.session = this.initializeSession();
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): UserSession {
    return {
      sessionId: this.sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 1,
      events: [],
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
  }

  private setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_visibility', 'engagement', 
        document.hidden ? 'hidden' : 'visible');
    });

    // Track scroll depth
    this.setupScrollTracking();
    
    // Track time on page
    this.setupTimeTracking();
  }

  private setupScrollTracking() {
    let maxScroll = 0;
    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
          this.trackEvent('scroll_depth', 'engagement', `${maxScroll}%`, `${maxScroll}%`, maxScroll);
        }
      }
    };
    window.addEventListener('scroll', trackScroll);
  }

  private setupTimeTracking() {
    setInterval(() => {
      this.session.lastActivity = Date.now();
    }, 30000); // Update every 30 seconds
  }

  // Core tracking method
  trackEvent(event: string, category: string, action: string, label?: string, value?: number, customData?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      customData
    };

    this.session.events.push(analyticsEvent);
    this.eventQueue.push(analyticsEvent);

    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        custom_parameter_session_id: this.sessionId
      });
    }

    // Store locally for offline analysis
    this.storeEventLocally(analyticsEvent);

    // Send to custom analytics endpoint
    this.sendToCustomEndpoint(analyticsEvent);
  }

  // Specific tracking methods for Createosaur features
  trackCreatureGeneration(generationType: 'anonymous' | 'authenticated', species: string[], success: boolean) {
    this.trackEvent('creature_generation', 'creation', generationType, success ? 'success' : 'failure', 1, {
      species,
      speciesCount: species.length,
      timestamp: Date.now()
    });
  }

  trackTrialProgress(generationsUsed: number, totalAllowed: number) {
    this.trackEvent('trial_progress', 'conversion', 'generation_used', 
      `${generationsUsed}/${totalAllowed}`, generationsUsed, {
      progress: generationsUsed / totalAllowed,
      generationsRemaining: totalAllowed - generationsUsed
    });
  }

  trackAuthAction(action: 'signup_attempt' | 'signup_success' | 'login_attempt' | 'login_success' | 'logout') {
    this.trackEvent('authentication', 'user_flow', action);
  }

  trackFeatureUsage(feature: string, action: string, details?: Record<string, any>) {
    this.trackEvent('feature_usage', feature, action, undefined, 1, details);
  }

  trackCommunityInteraction(action: 'view_gallery' | 'share_creature' | 'inspire_from_creature', details?: Record<string, any>) {
    this.trackEvent('community', 'interaction', action, undefined, 1, details);
  }

  trackError(error: string, component: string, details?: Record<string, any>) {
    this.trackEvent('error', 'application', error, component, 1, details);
  }

  private storeEventLocally(event: AnalyticsEvent) {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('createosaur_analytics') || '[]');
      storedEvents.push(event);
      
      // Keep only last 1000 events
      if (storedEvents.length > 1000) {
        storedEvents.splice(0, storedEvents.length - 1000);
      }
      
      localStorage.setItem('createosaur_analytics', JSON.stringify(storedEvents));
    } catch (error) {
      console.warn('Failed to store analytics event locally:', error);
    }
  }

  private async sendToCustomEndpoint(event: AnalyticsEvent) {
    try {
      // Send to your custom analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event to custom endpoint:', error);
    }
  }

  // Get analytics data for dashboard
  getSessionData(): UserSession {
    return { ...this.session };
  }

  getLocalAnalytics(): AnalyticsEvent[] {
    try {
      return JSON.parse(localStorage.getItem('createosaur_analytics') || '[]');
    } catch {
      return [];
    }
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, label?: string) {
    this.trackEvent('performance', 'timing', metric, label, value);
  }

  // A/B Testing support
  trackExperiment(experimentId: string, variant: string, action: string) {
    this.trackEvent('experiment', experimentId, action, variant, 1, {
      experimentId,
      variant
    });
  }
}

// Create global analytics instance
export const analytics = new CreatosaurAnalytics();

// Convenience methods for common tracking
export const trackCreatureGeneration = analytics.trackCreatureGeneration.bind(analytics);
export const trackTrialProgress = analytics.trackTrialProgress.bind(analytics);
export const trackAuthAction = analytics.trackAuthAction.bind(analytics);
export const trackFeatureUsage = analytics.trackFeatureUsage.bind(analytics);
export const trackCommunityInteraction = analytics.trackCommunityInteraction.bind(analytics);
export const trackError = analytics.trackError.bind(analytics);
export const trackPerformance = analytics.trackPerformance.bind(analytics);

// Web Vitals tracking
export const trackWebVitals = () => {
  // Track Core Web Vitals
  if ('PerformanceObserver' in window) {
    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        analytics.trackPerformance('first_contentful_paint', entry.startTime);
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      analytics.trackPerformance('largest_contentful_paint', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      analytics.trackPerformance('cumulative_layout_shift', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
};