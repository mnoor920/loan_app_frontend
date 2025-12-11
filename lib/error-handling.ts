// Comprehensive error handling utilities for admin components

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// Custom error class
export class AdminError extends Error {
  public readonly type: ErrorType;
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: any;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    status: number = 500,
    code?: string,
    details?: any,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AdminError';
    this.type = type;
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

// Parse API error response
export const parseApiError = async (response: Response): Promise<AdminError> => {
  let errorData: any = {};
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData = { message: await response.text() };
    }
  } catch (parseError) {
    errorData = { message: 'Failed to parse error response' };
  }

  const message = errorData.message || getDefaultErrorMessage(response.status);
  const type = getErrorType(response.status);
  const retryable = DEFAULT_RETRY_CONFIG.retryableStatuses.includes(response.status);

  return new AdminError(
    message,
    type,
    response.status,
    errorData.code,
    errorData.details,
    retryable
  );
};

// Get error type based on status code
export const getErrorType = (status: number): ErrorType => {
  if (status === 401) return ErrorType.AUTHENTICATION;
  if (status === 403) return ErrorType.AUTHORIZATION;
  if (status === 404) return ErrorType.NOT_FOUND;
  if (status >= 400 && status < 500) return ErrorType.VALIDATION;
  if (status >= 500) return ErrorType.SERVER;
  if (status === 0) return ErrorType.NETWORK;
  return ErrorType.UNKNOWN;
};

// Get default error message based on status code
export const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 0:
      return 'Network connection failed. Please check your internet connection.';
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication failed. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timeout. Please try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Get user-friendly error message
export const getUserFriendlyMessage = (error: AdminError): string => {
  const baseMessage = error.message;
  
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Connection problem. Please check your internet and try again.';
    case ErrorType.AUTHENTICATION:
      return 'Your session has expired. Please log in again.';
    case ErrorType.AUTHORIZATION:
      return 'You don\'t have permission for this action. Contact your administrator if needed.';
    case ErrorType.NOT_FOUND:
      return 'The requested item could not be found. It may have been deleted or moved.';
    case ErrorType.VALIDATION:
      return baseMessage || 'Please check your input and try again.';
    case ErrorType.SERVER:
      return 'Server error. Our team has been notified. Please try again in a few minutes.';
    default:
      return baseMessage || 'Something went wrong. Please try again.';
  }
};

// Get suggested actions for error recovery
export const getSuggestedActions = (error: AdminError): string[] => {
  const actions: string[] = [];
  
  switch (error.type) {
    case ErrorType.NETWORK:
      actions.push('Check your internet connection');
      actions.push('Try refreshing the page');
      actions.push('Contact IT support if the problem persists');
      break;
    case ErrorType.AUTHENTICATION:
      actions.push('Log out and log back in');
      actions.push('Clear your browser cache');
      actions.push('Contact support if you continue having issues');
      break;
    case ErrorType.AUTHORIZATION:
      actions.push('Contact your administrator for access');
      actions.push('Verify you have the correct permissions');
      break;
    case ErrorType.NOT_FOUND:
      actions.push('Check if the item still exists');
      actions.push('Try refreshing the page');
      actions.push('Go back and try again');
      break;
    case ErrorType.VALIDATION:
      actions.push('Review and correct the highlighted fields');
      actions.push('Make sure all required information is provided');
      break;
    case ErrorType.SERVER:
      if (error.retryable) {
        actions.push('Try again in a few moments');
        actions.push('The issue is usually temporary');
      }
      actions.push('Contact support if the problem continues');
      break;
    default:
      actions.push('Try refreshing the page');
      actions.push('Try again in a few moments');
      actions.push('Contact support if needed');
  }
  
  return actions;
};

// Retry mechanism with exponential backoff
export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AdminError;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof AdminError ? error : new AdminError(
        error instanceof Error ? error.message : 'Unknown error',
        ErrorType.UNKNOWN,
        500,
        undefined,
        undefined,
        true
      );
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === finalConfig.maxRetries || !lastError.retryable) {
        throw lastError;
      }
      
      // Wait before retrying with exponential backoff
      const delay = finalConfig.retryDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Enhanced fetch with error handling and retry
export const adminFetch = async (
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>
): Promise<Response> => {
  const operation = async (): Promise<Response> => {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw await parseApiError(response);
      }
      
      return response;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      
      // Network or other errors
      throw new AdminError(
        'Network request failed',
        ErrorType.NETWORK,
        0,
        undefined,
        error,
        true
      );
    }
  };
  
  return withRetry(operation, retryConfig);
};

// Enhanced fetch with JSON parsing
export const adminFetchJson = async <T = any>(
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>
): Promise<T> => {
  const response = await adminFetch(url, options, retryConfig);
  
  try {
    return await response.json();
  } catch (error) {
    throw new AdminError(
      'Failed to parse response as JSON',
      ErrorType.SERVER,
      response.status,
      'PARSE_ERROR',
      error
    );
  }
};

// Error logging utility
export const logError = (error: AdminError, context?: string) => {
  const errorInfo = {
    message: error.message,
    type: error.type,
    status: error.status,
    code: error.code,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Admin Error:', errorInfo, error.details);
  }
  
  // In production, you would send this to your error tracking service
  // Example: Sentry, LogRocket, etc.
  // errorTrackingService.captureError(errorInfo);
};

// Error boundary hook for React components
export const useErrorHandler = () => {
  const handleError = (error: Error | AdminError, context?: string) => {
    const adminError = error instanceof AdminError ? error : new AdminError(
      error.message,
      ErrorType.UNKNOWN,
      500,
      undefined,
      error
    );
    
    logError(adminError, context);
    
    // Handle specific error types
    switch (adminError.type) {
      case ErrorType.AUTHENTICATION:
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        break;
      case ErrorType.AUTHORIZATION:
        // Show unauthorized message
        break;
      default:
        // Show generic error message
        break;
    }
    
    return adminError;
  };
  
  return { handleError };
};

// Validation error formatter
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `Multiple issues found:\n${errors.map(error => `• ${error}`).join('\n')}`;
};

// Check if error is recoverable
export const isRecoverableError = (error: AdminError): boolean => {
  return error.retryable || [
    ErrorType.NETWORK,
    ErrorType.SERVER
  ].includes(error.type);
};

// Get error severity level
export const getErrorSeverity = (error: AdminError): 'low' | 'medium' | 'high' | 'critical' => {
  switch (error.type) {
    case ErrorType.VALIDATION:
      return 'low';
    case ErrorType.NOT_FOUND:
      return 'medium';
    case ErrorType.AUTHORIZATION:
      return 'medium';
    case ErrorType.AUTHENTICATION:
      return 'high';
    case ErrorType.SERVER:
      return error.status >= 500 ? 'critical' : 'high';
    case ErrorType.NETWORK:
      return 'high';
    default:
      return 'medium';
  }
};