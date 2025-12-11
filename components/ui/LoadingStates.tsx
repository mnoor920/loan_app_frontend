'use client';

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

// Generic loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}

// Skeleton loading for cards
interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({ className = '', showAvatar = false, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex items-start gap-4">
        {showAvatar && (
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
                i === lines - 1 ? 'w-3/4' : 'w-full'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton loading for tables
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Table Header */}
      <div className="flex gap-4 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }, (_, i) => (
          <div key={i} className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
      
      {/* Table Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }, (_, colIndex) => (
              <div
                key={colIndex}
                className={`flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded ${
                  colIndex === columns - 1 ? 'w-20' : ''
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton loading for stats cards
interface SkeletonStatsProps {
  count?: number;
  className?: string;
}

export function SkeletonStats({ count = 4, className = '' }: SkeletonStatsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

// Loading overlay for forms
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children, 
  className = '' 
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" className="text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Button loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function LoadingButton({ 
  isLoading = false, 
  loadingText, 
  children, 
  variant = 'primary',
  className = '',
  disabled,
  ...props 
}: LoadingButtonProps) {
  const baseClasses = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {isLoading ? (loadingText || 'Loading...') : children}
    </button>
  );
}

// Page loading state
interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message = 'Loading...', className = '' }: PageLoadingProps) {
  return (
    <div className={`flex min-h-screen w-full bg-gray-50 dark:bg-gray-950 items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// Inline loading state
interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoading({ 
  message = 'Loading...', 
  size = 'md', 
  className = '' 
}: InlineLoadingProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoadingSpinner size={size} className="text-blue-600 dark:text-blue-400" />
      <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
    </div>
  );
}

// List loading state with skeleton items
interface SkeletonListProps {
  count?: number;
  showAvatar?: boolean;
  className?: string;
}

export function SkeletonList({ count = 5, showAvatar = true, className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
          {showAvatar && (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

// Form field loading state
interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

export function SkeletonForm({ fields = 6, className = '' }: SkeletonFormProps) {
  return (
    <div className={`space-y-6 animate-pulse ${className}`}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );
}

// Progress indicator
interface ProgressIndicatorProps {
  progress: number; // 0-100
  message?: string;
  className?: string;
}

export function ProgressIndicator({ 
  progress, 
  message, 
  className = '' 
}: ProgressIndicatorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 text-right">
        {Math.round(progress)}%
      </p>
    </div>
  );
}

// Refresh indicator
interface RefreshIndicatorProps {
  isRefreshing: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function RefreshIndicator({ 
  isRefreshing, 
  onRefresh, 
  className = '' 
}: RefreshIndicatorProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 transition-colors ${className}`}
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}