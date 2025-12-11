/**
 * Cache key constants for consistent cache management
 */

export const CACHE_KEYS = {
  // Dashboard related keys
  DASHBOARD: {
    USER_LOANS: (userId: string) => `user_${userId}_loans`,
    DASHBOARD_STATS: (userId: string) => `user_${userId}_stats`,
    RECENT_LOANS: (userId: string) => `user_${userId}_recent_loans`,
    LOAN_SUMMARY: (userId: string) => `user_${userId}_loan_summary`,
  },

  // Profile related keys
  PROFILE: {
    USER_PROFILE: (userId: string) => `user_${userId}_profile`,
    ACTIVATION_STATUS: (userId: string) => `user_${userId}_activation`,
    ACTIVATION_STEPS: (userId: string) => `user_${userId}_activation_steps`,
    PROFILE_BATCH: (userId: string) => `user_${userId}_profile_batch`,
  },

  // Loan specific keys
  LOANS: {
    LOAN_DETAILS: (loanId: string) => `loan_${loanId}_details`,
    USER_LOAN_LIST: (userId: string) => `user_${userId}_loan_list`,
    LOAN_CALCULATIONS: (amount: number, duration: number, rate: number) => 
      `calc_${amount}_${duration}_${rate}`,
  },

  // User preferences and settings
  USER: {
    PREFERENCES: (userId: string) => `user_${userId}_preferences`,
    SETTINGS: (userId: string) => `user_${userId}_settings`,
    THEME: (userId: string) => `user_${userId}_theme`,
  },

  // System cache keys
  SYSTEM: {
    APP_CONFIG: 'app_config',
    FEATURE_FLAGS: 'feature_flags',
    API_STATUS: 'api_status',
  }
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  VERY_SHORT: 30 * 1000,      // 30 seconds
  SHORT: 2 * 60 * 1000,       // 2 minutes
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 10 * 60 * 1000,       // 10 minutes
  VERY_LONG: 60 * 60 * 1000,  // 1 hour
  PERSISTENT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Cache invalidation patterns
export const CACHE_PATTERNS = {
  USER_DATA: (userId: string) => `user_${userId}_.*`,
  LOAN_DATA: (userId: string) => `user_${userId}_loan.*`,
  PROFILE_DATA: (userId: string) => `user_${userId}_profile.*`,
  ALL_USER_DATA: (userId: string) => `user_${userId}_.*`,
} as const;