'use client';

import React from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  Shield, 
  Search, 
  Server, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { AdminError, ErrorType } from '@/lib/error-handling';
import { getErrorDisplayMessage, getRecoveryActions } from '@/lib/api-client';

interface ErrorDisplayProps {
  error: AdminError;
  onRetry?: () => void;
  onDismiss?: () => void;
  canRetry?: boolean;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  variant?: 'banner' | 'card' | 'inline';
  showDetails?: boolean;
}

const getErrorIcon = (type: ErrorType) => {
  switch (type) {
    case ErrorType.NETWORK:
      return Wifi;
    case ErrorType.AUTHENTICATION:
    case ErrorType.AUTHORIZATION:
      return Shield;
    case ErrorType.NOT_FOUND:
      return Search;
    case ErrorType.SERVER:
      return Server;
    case ErrorType.VALIDATION:
      return AlertCircle;
    default:
      return AlertTriangle;
  }
};

const getErrorColor = (type: ErrorType) => {
  switch (type) {
    case ErrorType.NETWORK:
      return 'blue';
    case ErrorType.AUTHENTICATION:
    case ErrorType.AUTHORIZATION:
      return 'yellow';
    case ErrorType.NOT_FOUND:
      return 'gray';
    case ErrorType.SERVER:
      return 'red';
    case ErrorType.VALIDATION:
      return 'orange';
    default:
      return 'red';
  }
};

export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  canRetry = false,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  className = '',
  variant = 'banner',
  showDetails = false
}: ErrorDisplayProps) {
  const Icon = getErrorIcon(error.type);
  const color = getErrorColor(error.type);
  const message = getErrorDisplayMessage(error);
  const recoveryActions = getRecoveryActions(error);
  const remainingRetries = maxRetries - retryCount;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-300',
      text: 'text-blue-700 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-300',
      text: 'text-yellow-700 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      icon: 'text-gray-600 dark:text-gray-400',
      title: 'text-gray-800 dark:text-gray-300',
      text: 'text-gray-700 dark:text-gray-400',
      button: 'bg-gray-600 hover:bg-gray-700 text-white'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
      title: 'text-orange-800 dark:text-orange-300',
      text: 'text-orange-700 dark:text-orange-400',
      button: 'bg-orange-600 hover:bg-orange-700 text-white'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-800 dark:text-red-300',
      text: 'text-red-700 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    }
  };

  const colors = colorClasses[color];

  if (variant === 'banner') {
    return (
      <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className={`text-sm font-medium ${colors.title}`}>
                  {error.type === ErrorType.NETWORK ? 'Connection Problem' :
                   error.type === ErrorType.AUTHENTICATION ? 'Authentication Required' :
                   error.type === ErrorType.AUTHORIZATION ? 'Access Denied' :
                   error.type === ErrorType.NOT_FOUND ? 'Not Found' :
                   error.type === ErrorType.VALIDATION ? 'Validation Error' :
                   error.type === ErrorType.SERVER ? 'Server Error' :
                   'Error'}
                </p>
                <p className={`text-sm ${colors.text} mt-1`}>{message}</p>
                
                {recoveryActions.length > 0 && (
                  <div className="mt-3">
                    <p className={`text-xs font-medium ${colors.title} mb-1`}>What you can do:</p>
                    <ul className={`text-xs ${colors.text} space-y-0.5`}>
                      {recoveryActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="mt-1">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {canRetry && onRetry && (
                  <button
                    onClick={onRetry}
                    disabled={isRetrying || remainingRetries <= 0}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${colors.button} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                    {isRetrying ? 'Retrying...' : `Retry${remainingRetries > 0 ? ` (${remainingRetries} left)` : ''}`}
                  </button>
                )}
                
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className={`p-1 rounded-md transition-colors hover:bg-black/10 dark:hover:bg-white/10`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {showDetails && process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-md">
            <summary className={`text-xs font-medium ${colors.title} cursor-pointer`}>
              Error Details (Development)
            </summary>
            <div className={`mt-2 text-xs ${colors.text} font-mono space-y-1`}>
              <div><strong>Type:</strong> {error.type}</div>
              <div><strong>Status:</strong> {error.status}</div>
              {error.code && <div><strong>Code:</strong> {error.code}</div>}
              <div><strong>Message:</strong> {error.message}</div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border ${colors.border} p-6 ${className}`}>
        <div className="text-center">
          <div className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          
          <h3 className={`text-lg font-semibold ${colors.title} mb-2`}>
            {error.type === ErrorType.NETWORK ? 'Connection Problem' :
             error.type === ErrorType.AUTHENTICATION ? 'Authentication Required' :
             error.type === ErrorType.AUTHORIZATION ? 'Access Denied' :
             error.type === ErrorType.NOT_FOUND ? 'Not Found' :
             error.type === ErrorType.VALIDATION ? 'Validation Error' :
             error.type === ErrorType.SERVER ? 'Server Error' :
             'Something Went Wrong'}
          </h3>
          
          <p className={`text-sm ${colors.text} mb-6`}>{message}</p>
          
          {recoveryActions.length > 0 && (
            <div className="mb-6">
              <p className={`text-sm font-medium ${colors.title} mb-2`}>What you can do:</p>
              <ul className={`text-sm ${colors.text} space-y-1 text-left max-w-sm mx-auto`}>
                {recoveryActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-center gap-3">
            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying || remainingRetries <= 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${colors.button} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : `Try Again${remainingRetries > 0 ? ` (${remainingRetries} left)` : ''}`}
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className={`flex items-center gap-2 text-sm ${colors.text} ${className}`}>
      <Icon className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
      <span className="flex-1">{message}</span>
      {canRetry && onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${colors.button} disabled:opacity-50`}
        >
          <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}

// Success message component for consistency
interface SuccessDisplayProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'banner' | 'inline';
}

export function SuccessDisplay({ 
  message, 
  onDismiss, 
  className = '', 
  variant = 'banner' 
}: SuccessDisplayProps) {
  if (variant === 'banner') {
    return (
      <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800 dark:text-green-300 flex-1">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-md transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-green-700 dark:text-green-400 ${className}`}>
      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}