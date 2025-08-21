// Performance monitoring utilities

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, (metric: PerformanceMetric) => void> = new Map();

  // Track page load performance
  trackPageLoad() {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
      this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
      this.recordMetric('first_paint', performance.getEntriesByName('first-paint')[0]?.startTime || 0, 'ms');
      this.recordMetric('first_contentful_paint', performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, 'ms');
    }
  }

  // Track API call performance
  trackApiCall(url: string, startTime: number, endTime: number) {
    const duration = endTime - startTime;
    this.recordMetric(`api_call_${url}`, duration, 'ms');
    
    if (duration > 1000) {
      console.warn(`Slow API call detected: ${url} took ${duration}ms`);
    }
  }

  // Track component render time
  trackComponentRender(componentName: string, renderTime: number) {
    this.recordMetric(`component_render_${componentName}`, renderTime, 'ms');
  }

  // Track memory usage
  trackMemoryUsage() {
    if (typeof window === 'undefined' || !performance.memory) return;

    const memory = performance.memory;
    this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, 'MB');
    this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, 'MB');
    this.recordMetric('memory_limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB');
  }

  // Record a metric
  recordMetric(name: string, value: number, unit: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    
    // Notify observers
    this.observers.forEach((callback) => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    });

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Get metrics by name
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  // Get average metric value
  getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  // Subscribe to metric updates
  subscribe(callback: (metric: PerformanceMetric) => void): () => void {
    const id = Math.random().toString(36);
    this.observers.set(id, callback);
    
    return () => {
      this.observers.delete(id);
    };
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for tracking component performance
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    performanceMonitor.trackComponentRender(componentName, renderTime);
  };
}

// Utility to wrap API calls with performance tracking
export function withPerformanceTracking<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const endTime = performance.now();
      performanceMonitor.trackApiCall(operationName, startTime, endTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      performanceMonitor.trackApiCall(`${operationName}_error`, startTime, endTime);
      throw error;
    }
  };
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Track page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.trackPageLoad();
    }, 0);
  });

  // Track memory usage periodically
  setInterval(() => {
    performanceMonitor.trackMemoryUsage();
  }, 30000); // Every 30 seconds

  // Track long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            performanceMonitor.recordMetric('long_task', entry.duration, 'ms');
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long task monitoring not supported');
    }
  }
}