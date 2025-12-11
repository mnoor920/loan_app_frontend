/**
 * Performance monitoring utilities for tracking cache effectiveness and page load times
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  queryExecutionTime: number;
  timestamp: number;
  page: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private cacheMetrics: Map<string, CacheMetrics> = new Map();
  private pageLoadStart: number = 0;

  /**
   * Start tracking page load time
   */
  startPageLoad(): void {
    this.pageLoadStart = performance.now();
  }

  /**
   * End page load tracking and record metrics
   */
  endPageLoad(pageName: string): number {
    const loadTime = performance.now() - this.pageLoadStart;
    
    this.recordMetric({
      pageLoadTime: loadTime,
      apiResponseTime: 0,
      cacheHitRate: this.getOverallCacheHitRate(),
      queryExecutionTime: 0,
      timestamp: Date.now(),
      page: pageName
    });

    return loadTime;
  }

  /**
   * Track API response time
   */
  async trackApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await apiCall();
      const responseTime = performance.now() - start;
      
      console.log(`API ${apiName} took ${responseTime.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const responseTime = performance.now() - start;
      console.log(`API ${apiName} failed after ${responseTime.toFixed(2)}ms`);
      throw error;
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheKey: string): void {
    const metrics = this.cacheMetrics.get(cacheKey) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0
    };

    metrics.hits++;
    metrics.totalRequests++;
    metrics.hitRate = (metrics.hits / metrics.totalRequests) * 100;
    
    this.cacheMetrics.set(cacheKey, metrics);
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheKey: string): void {
    const metrics = this.cacheMetrics.get(cacheKey) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0
    };

    metrics.misses++;
    metrics.totalRequests++;
    metrics.hitRate = (metrics.hits / metrics.totalRequests) * 100;
    
    this.cacheMetrics.set(cacheKey, metrics);
  }

  /**
   * Get cache metrics for a specific key
   */
  getCacheMetrics(cacheKey: string): CacheMetrics | null {
    return this.cacheMetrics.get(cacheKey) || null;
  }

  /**
   * Get overall cache hit rate
   */
  getOverallCacheHitRate(): number {
    let totalHits = 0;
    let totalRequests = 0;

    this.cacheMetrics.forEach(metrics => {
      totalHits += metrics.hits;
      totalRequests += metrics.totalRequests;
    });

    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  /**
   * Record performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averagePageLoad: number;
    averageApiResponse: number;
    overallCacheHitRate: number;
    totalMetrics: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averagePageLoad: 0,
        averageApiResponse: 0,
        overallCacheHitRate: 0,
        totalMetrics: 0
      };
    }

    const avgPageLoad = this.metrics.reduce((sum, m) => sum + m.pageLoadTime, 0) / this.metrics.length;
    const avgApiResponse = this.metrics.reduce((sum, m) => sum + m.apiResponseTime, 0) / this.metrics.length;

    return {
      averagePageLoad: avgPageLoad,
      averageApiResponse: avgApiResponse,
      overallCacheHitRate: this.getOverallCacheHitRate(),
      totalMetrics: this.metrics.length
    };
  }

  /**
   * Log performance summary to console
   */
  logPerformanceSummary(): void {
    const summary = this.getPerformanceSummary();
    
    console.group('🚀 Performance Summary');
    console.log(`Average Page Load: ${summary.averagePageLoad.toFixed(2)}ms`);
    console.log(`Average API Response: ${summary.averageApiResponse.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${summary.overallCacheHitRate.toFixed(1)}%`);
    console.log(`Total Metrics: ${summary.totalMetrics}`);
    console.groupEnd();
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  checkPerformanceThresholds(): {
    pageLoadOk: boolean;
    apiResponseOk: boolean;
    cacheHitRateOk: boolean;
    warnings: string[];
  } {
    const summary = this.getPerformanceSummary();
    const warnings: string[] = [];
    
    const pageLoadOk = summary.averagePageLoad < 2000; // 2 seconds
    const apiResponseOk = summary.averageApiResponse < 500; // 500ms
    const cacheHitRateOk = summary.overallCacheHitRate > 70; // 70%

    if (!pageLoadOk) {
      warnings.push(`Page load time (${summary.averagePageLoad.toFixed(0)}ms) exceeds 2000ms threshold`);
    }
    
    if (!apiResponseOk) {
      warnings.push(`API response time (${summary.averageApiResponse.toFixed(0)}ms) exceeds 500ms threshold`);
    }
    
    if (!cacheHitRateOk) {
      warnings.push(`Cache hit rate (${summary.overallCacheHitRate.toFixed(1)}%) below 70% threshold`);
    }

    return {
      pageLoadOk,
      apiResponseOk,
      cacheHitRateOk,
      warnings
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.cacheMetrics.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy performance tracking
export const performanceUtils = {
  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      console.log(`⏱️ ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`❌ ${name} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  },

  /**
   * Measure synchronous function execution time
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      console.log(`⏱️ ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`❌ ${name} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  },

  /**
   * Start page load tracking
   */
  startPageTracking(): void {
    performanceMonitor.startPageLoad();
  },

  /**
   * End page load tracking
   */
  endPageTracking(pageName: string): number {
    return performanceMonitor.endPageLoad(pageName);
  }
};