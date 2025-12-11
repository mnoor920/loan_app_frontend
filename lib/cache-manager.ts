/**
 * Client-side cache manager for profile and dashboard data
 * Implements TTL-based caching with background refresh capabilities
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);
      if (!entry) {
        return null;
      }

      const now = Date.now();
      const isExpired = now - entry.timestamp > entry.ttl;

      if (isExpired) {
        this.cache.delete(key);
        return null;
      }

      return entry.data as T;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache with TTL (time to live in milliseconds)
   */
  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        key
      };

      this.cache.set(key, entry);

      // Also store in localStorage for persistence across page reloads
      try {
        const storageEntry = {
          ...entry,
          expiresAt: Date.now() + ttl
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(storageEntry));
      } catch (storageError) {
        // localStorage might be full or disabled, continue without it
        console.warn('localStorage cache failed:', storageError);
      }
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * Get data from localStorage cache if available
   */
  getFromStorage<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (!stored) {
        return null;
      }

      const entry = JSON.parse(stored);
      const now = Date.now();

      if (now > entry.expiresAt) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return entry.data as T;
    } catch (error) {
      console.warn('Storage cache get error:', error);
      return null;
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    try {
      this.cache.delete(key);
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Cache invalidate error:', error);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    try {
      // Clear memory cache
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }

      // Clear localStorage cache
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_') && key.includes(pattern)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache pattern invalidate error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      this.cache.clear();
      
      // Clear localStorage cache entries
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Cache key constants
export const CACHE_KEYS = {
  PROFILE_BATCH: (userId: string) => `profile_batch_${userId}`,
  DASHBOARD_FAST: (userId: string) => `dashboard_fast_${userId}`,
  USER_DOCUMENTS: (userId: string) => `user_documents_${userId}`,
  ACTIVATION_PROFILE: (userId: string) => `activation_profile_${userId}`,
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  PROFILE_DATA: 10 * 60 * 1000, // 10 minutes
  DASHBOARD_DATA: 5 * 60 * 1000, // 5 minutes
  DOCUMENTS: 15 * 60 * 1000, // 15 minutes
  USER_INFO: 60 * 60 * 1000, // 1 hour
} as const;