// Performance optimization utilities for admin dashboard

import { NextRequest } from 'next/server';

// Pagination utilities
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePaginationParams(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams;
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    MAX_PAGE_SIZE, 
    Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10))
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginationResult<T> {
  const totalPages = Math.ceil(total / params.limit);
  
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore: params.page < totalPages,
      hasPrevious: params.page > 1
    }
  };
}

// Search and filter utilities
export interface SearchParams {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function parseSearchParams(request: NextRequest): SearchParams {
  const searchParams = request.nextUrl.searchParams;
  
  return {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  };
}

// SQL query optimization utilities
export function buildWhereClause(conditions: Array<{ field: string; value: any; operator?: string }>): string {
  if (conditions.length === 0) return '';
  
  const clauses = conditions
    .filter(condition => condition.value !== undefined && condition.value !== null)
    .map(condition => {
      const operator = condition.operator || '=';
      if (operator === 'ILIKE') {
        return `${condition.field} ILIKE '%${condition.value}%'`;
      }
      return `${condition.field} ${operator} '${condition.value}'`;
    });
  
  return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

export function buildOrderByClause(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): string {
  if (!sortBy) return '';
  
  // Sanitize sort field to prevent SQL injection
  const allowedSortFields = [
    'created_at',
    'updated_at',
    'application_date',
    'completed_at',
    'full_name',
    'email',
    'loan_amount',
    'status'
  ];
  
  if (!allowedSortFields.includes(sortBy)) {
    return 'ORDER BY created_at DESC';
  }
  
  return `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
}

// Caching utilities
export interface CacheConfig {
  key: string;
  ttl: number; // Time to live in seconds
}

export class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();
  
  set(key: string, data: any, ttl: number): void {
    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, { data, expires });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const adminCache = new SimpleCache();

// Clean up cache every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    adminCache.cleanup();
  }, 5 * 60 * 1000);
}

// Response compression utilities
export function shouldCompress(data: any): boolean {
  const jsonString = JSON.stringify(data);
  return jsonString.length > 1024; // Compress responses larger than 1KB
}

// Database connection pooling utilities
export interface QueryOptions {
  useCache?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
  timeout?: number;
}

export async function executeQuery<T>(
  query: string,
  params: any[] = [],
  options: QueryOptions = {}
): Promise<T> {
  const {
    useCache = false,
    cacheKey,
    cacheTtl = 300, // 5 minutes default
    timeout = 30000 // 30 seconds default
  } = options;
  
  // Check cache first
  if (useCache && cacheKey) {
    const cached = adminCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Execute query with timeout
  const queryPromise = new Promise<T>((resolve, reject) => {
    // This would be replaced with actual database query execution
    // For now, we'll simulate it
    setTimeout(() => {
      reject(new Error('Query timeout'));
    }, timeout);
    
    // Actual query execution would go here
    // resolve(result);
  });
  
  try {
    const result = await queryPromise;
    
    // Cache result if requested
    if (useCache && cacheKey) {
      adminCache.set(cacheKey, result, cacheTtl);
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

// Performance monitoring utilities
export interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  resultCount: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  
  startTimer(): () => PerformanceMetrics {
    const startTime = Date.now();
    
    return (cacheHit: boolean = false, resultCount: number = 0): PerformanceMetrics => {
      const queryTime = Date.now() - startTime;
      const metric: PerformanceMetrics = {
        queryTime,
        cacheHit,
        resultCount,
        timestamp: Date.now()
      };
      
      this.metrics.push(metric);
      
      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }
      
      return metric;
    };
  }
  
  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const total = this.metrics.reduce((sum, metric) => sum + metric.queryTime, 0);
    return total / this.metrics.length;
  }
  
  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const cacheHits = this.metrics.filter(metric => metric.cacheHit).length;
    return (cacheHits / this.metrics.length) * 100;
  }
  
  getSlowQueries(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.queryTime > threshold);
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Memory usage utilities
export function getMemoryUsage(): NodeJS.MemoryUsage | null {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage();
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Request rate limiting utilities
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
  
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Global rate limiter for admin endpoints
export const adminRateLimiter = new RateLimiter(200, 60000); // 200 requests per minute

// Clean up rate limiter every minute
if (typeof window === 'undefined') {
  setInterval(() => {
    adminRateLimiter.cleanup();
  }, 60000);
}