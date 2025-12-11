// Enhanced API client with comprehensive error handling for admin components

import { AdminError, ErrorType, parseApiError, adminFetch, adminFetchJson, RetryConfig } from './error-handling';

// Default retry configuration for admin operations
const ADMIN_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// API response wrapper
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Admin API client class
export class AdminApiClient {
  private baseUrl: string;
  private defaultRetryConfig: RetryConfig;

  constructor(baseUrl: string = '/api/admin', retryConfig: RetryConfig = ADMIN_RETRY_CONFIG) {
    this.baseUrl = baseUrl;
    this.defaultRetryConfig = retryConfig;
  }

  // Generic GET request
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await adminFetch(url.toString(), {
      method: 'GET'
    }, { ...this.defaultRetryConfig, ...retryConfig });

    return await response.json();
  }

  // Generic POST request
  async post<T = any>(
    endpoint: string,
    data?: any,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const response = await adminFetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }, { ...this.defaultRetryConfig, ...retryConfig });

    return await response.json();
  }

  // Generic PUT request
  async put<T = any>(
    endpoint: string,
    data?: any,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const response = await adminFetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }, { ...this.defaultRetryConfig, ...retryConfig });

    return await response.json();
  }

  // Generic DELETE request
  async delete<T = any>(
    endpoint: string,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const response = await adminFetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE'
    }, { ...this.defaultRetryConfig, ...retryConfig });

    return await response.json();
  }

  // Dashboard statistics
  async getDashboardStats(retryConfig?: Partial<RetryConfig>) {
    return this.get('/dashboard/stats', undefined, retryConfig);
  }

  // User management
  async getActivatedUsers(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  }, retryConfig?: Partial<RetryConfig>) {
    return this.get('/users/activated', params, retryConfig);
  }

  async getUserProfile(userId: string, retryConfig?: Partial<RetryConfig>) {
    return this.get(`/users/${userId}/profile`, undefined, retryConfig);
  }

  async updateUserProfile(
    userId: string,
    profileData: any,
    adminId: string,
    reason?: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    return this.put(`/users/${userId}/profile`, {
      ...profileData,
      adminId,
      reason
    }, retryConfig);
  }

  async deleteUserDocument(
    userId: string,
    documentId: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    return this.delete(`/users/${userId}/documents/${documentId}`, retryConfig);
  }

  async replaceUserDocument(
    userId: string,
    documentId: string,
    formData: FormData,
    retryConfig?: Partial<RetryConfig>
  ) {
    return this.put(`/users/${userId}/documents/${documentId}/replace`, formData, retryConfig);
  }

  // Helper method to fetch document content as Blob using auth headers
  async getDocumentContent(documentId: string, retryConfig?: Partial<RetryConfig>): Promise<Blob> {
    // Note: documents endpoint is under /api/documents not /api/admin
    const url = `/api/documents/${documentId}/content`;

    const response = await adminFetch(url, {
      method: 'GET'
    }, { ...this.defaultRetryConfig, ...retryConfig });

    return await response.blob();
  }

  // Loan management
  async getAllLoans(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }, retryConfig?: Partial<RetryConfig>) {
    return this.get('/loans/all', params, retryConfig);
  }

  async getLoanDetails(loanId: string, retryConfig?: Partial<RetryConfig>) {
    return this.get(`/loans/${loanId}/details`, undefined, retryConfig);
  }

  async updateLoan(
    loanId: string,
    loanData: any,
    adminId: string,
    reason?: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    return this.put(`/loans/${loanId}`, {
      ...loanData,
      adminId,
      reason
    }, retryConfig);
  }

  // Notification management
  async getUserNotifications(userId: string, retryConfig?: Partial<RetryConfig>) {
    return this.get(`/users/${userId}/notifications`, undefined, retryConfig);
  }

  async markNotificationAsRead(notificationId: string, retryConfig?: Partial<RetryConfig>) {
    return this.put(`/notifications/${notificationId}/read`, undefined, retryConfig);
  }

  // Withdrawal Code Management
  async generateWithdrawalCode(loanId: string, retryConfig?: Partial<RetryConfig>) {
    return this.post<{ success: boolean; message: string; code: string }>(
      `/loans/${loanId}/generate-withdrawal-code`,
      undefined,
      retryConfig
    );
  }

  async setWithdrawalCode(loanId: string, code: string, retryConfig?: Partial<RetryConfig>) {
    return this.post<{ success: boolean; message: string; code: string }>(
      `/loans/${loanId}/set-withdrawal-code`,
      { code },
      retryConfig
    );
  }
}

// Default admin API client instance
export const adminApi = new AdminApiClient();

// Error handling utilities for components
export const handleApiError = (error: any, context?: string): AdminError => {
  if (error instanceof AdminError) {
    return error;
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AdminError(
      'Network connection failed. Please check your internet connection.',
      ErrorType.NETWORK,
      0,
      'NETWORK_ERROR',
      error,
      true
    );
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError) {
    return new AdminError(
      'Invalid response from server. Please try again.',
      ErrorType.SERVER,
      500,
      'PARSE_ERROR',
      error,
      true
    );
  }

  // Generic error
  return new AdminError(
    error.message || 'An unexpected error occurred',
    ErrorType.UNKNOWN,
    500,
    'UNKNOWN_ERROR',
    error,
    true
  );
};

// Utility function to check if an error is recoverable
export const isRecoverableError = (error: AdminError): boolean => {
  return error.retryable || [
    ErrorType.NETWORK,
    ErrorType.SERVER
  ].includes(error.type);
};

// Utility function to get user-friendly error message
export const getErrorDisplayMessage = (error: AdminError): string => {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Connection problem. Please check your internet and try again.';
    case ErrorType.AUTHENTICATION:
      return 'Your session has expired. Please log in again.';
    case ErrorType.AUTHORIZATION:
      return 'You don\'t have permission for this action.';
    case ErrorType.NOT_FOUND:
      return 'The requested item could not be found.';
    case ErrorType.VALIDATION:
      return error.message || 'Please check your input and try again.';
    case ErrorType.SERVER:
      return 'Server error. Please try again in a few minutes.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
};

// Utility function to get suggested recovery actions
export const getRecoveryActions = (error: AdminError): string[] => {
  const actions: string[] = [];

  switch (error.type) {
    case ErrorType.NETWORK:
      actions.push('Check your internet connection');
      actions.push('Try refreshing the page');
      break;
    case ErrorType.AUTHENTICATION:
      actions.push('Log out and log back in');
      actions.push('Clear your browser cache');
      break;
    case ErrorType.AUTHORIZATION:
      actions.push('Contact your administrator for access');
      break;
    case ErrorType.NOT_FOUND:
      actions.push('Check if the item still exists');
      actions.push('Try refreshing the page');
      break;
    case ErrorType.VALIDATION:
      actions.push('Review and correct the highlighted fields');
      break;
    case ErrorType.SERVER:
      if (error.retryable) {
        actions.push('Try again in a few moments');
      }
      actions.push('Contact support if the problem continues');
      break;
    default:
      actions.push('Try refreshing the page');
      actions.push('Contact support if needed');
  }

  return actions;
};

// Error handling utility for async operations
export const withAsyncErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    // Just log the error and re-throw it for now
    console.error('Async operation failed:', error);
    throw error;
  }
};

export default adminApi;