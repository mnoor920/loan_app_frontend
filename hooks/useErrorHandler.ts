'use client';

import { useState, useCallback } from 'react';
import { AdminError, ErrorType, logError, withRetry, RetryConfig } from '@/lib/error-handling';

interface UseErrorHandlerOptions {
  maxRetries?: number;
  onError?: (error: AdminError) => void;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
}

interface ErrorState {
  error: AdminError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false
  });

  const handleError = useCallback((error: Error | AdminError, context?: string) => {
    const adminError = error instanceof AdminError ? error : new AdminError(
      error.message,
      ErrorType.UNKNOWN,
      500,
      undefined,
      error
    );

    logError(adminError, context);

    setErrorState({
      error: adminError,
      isRetrying: false,
      retryCount: 0,
      canRetry: adminError.retryable && (options.maxRetries || 3) > 0
    });

    if (options.onError) {
      options.onError(adminError);
    }

    return adminError;
  }, [options]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: false
    });
  }, []);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (!errorState.canRetry || !errorState.error) return;

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }));

    if (options.onRetry) {
      options.onRetry(errorState.retryCount + 1);
    }

    try {
      const result = await operation();
      
      setErrorState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: false
      });

      if (options.onSuccess) {
        options.onSuccess();
      }

      return result;
    } catch (error) {
      const newRetryCount = errorState.retryCount + 1;
      const maxRetries = options.maxRetries || 3;
      
      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
        retryCount: newRetryCount,
        canRetry: newRetryCount < maxRetries && prev.error?.retryable === true
      }));

      if (newRetryCount >= maxRetries) {
        handleError(error as Error, 'retry_exhausted');
      }

      throw error;
    }
  }, [errorState, options, handleError]);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T | null> => {
    try {
      clearError();
      
      if (retryConfig) {
        return await withRetry(operation, retryConfig);
      } else {
        return await operation();
      }
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError, clearError]);

  const getErrorMessage = useCallback((fallback?: string) => {
    if (!errorState.error) return null;
    
    return errorState.error.message || fallback || 'An unexpected error occurred';
  }, [errorState.error]);

  const hasError = errorState.error !== null;
  const isRetrying = errorState.isRetrying;
  const canRetry = errorState.canRetry;
  const retryCount = errorState.retryCount;

  return {
    error: errorState.error,
    hasError,
    isRetrying,
    canRetry,
    retryCount,
    handleError,
    clearError,
    retry,
    executeWithErrorHandling,
    getErrorMessage
  };
};

export default useErrorHandler;