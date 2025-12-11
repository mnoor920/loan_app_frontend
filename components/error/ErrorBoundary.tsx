'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { AdminError, ErrorType, logError, getUserFriendlyMessage, getSuggestedActions } from '@/lib/error-handling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: AdminError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const adminError = error instanceof AdminError ? error : new AdminError(
      error.message,
      ErrorType.UNKNOWN,
      500,
      undefined,
      error
    );

    return {
      hasError: true,
      error: adminError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const adminError = this.state.error || new AdminError(
      error.message,
      ErrorType.UNKNOWN,
      500,
      undefined,
      error
    );

    this.setState({ errorInfo });

    // Log the error
    logError(adminError, 'ErrorBoundary');

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  handleGoHome = () => {
    window.location.href = '/admin/dashboard';
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.message,
      type: error?.type,
      status: error?.status,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // In a real app, you would send this to your error reporting service
    console.log('Error Report:', errorReport);
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
      alert('Error details copied to clipboard. Please share this with support.');
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { error } = this.state;
      const { showDetails = false } = this.props;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userMessage = getUserFriendlyMessage(error);
      const suggestedActions = getSuggestedActions(error);
      const canRetry = this.state.retryCount < this.maxRetries && error.retryable;

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              {error.type === ErrorType.NETWORK ? 'Connection Problem' :
               error.type === ErrorType.AUTHENTICATION ? 'Authentication Required' :
               error.type === ErrorType.AUTHORIZATION ? 'Access Denied' :
               error.type === ErrorType.NOT_FOUND ? 'Not Found' :
               error.type === ErrorType.SERVER ? 'Server Error' :
               'Something Went Wrong'}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {userMessage}
            </p>

            {/* Suggested Actions */}
            {suggestedActions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  What you can do:
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {suggestedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>

              <button
                onClick={this.handleReportError}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm"
              >
                <Bug className="w-4 h-4" />
                Report This Error
              </button>
            </div>

            {/* Error Details (Development/Debug) */}
            {showDetails && process.env.NODE_ENV === 'development' && (
              <details className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Error Details (Development)
                </summary>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
                  <div className="mb-2">
                    <strong>Type:</strong> {error.type}
                  </div>
                  <div className="mb-2">
                    <strong>Status:</strong> {error.status}
                  </div>
                  {error.code && (
                    <div className="mb-2">
                      <strong>Code:</strong> {error.code}
                    </div>
                  )}
                  <div className="mb-2">
                    <strong>Message:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}