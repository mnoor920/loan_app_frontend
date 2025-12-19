/**
 * Optimized dashboard content component with cache-first loading
 */

'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFastDashboard } from '@/hooks/useFastDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/loan-calculations';
import { 
  TrendingUp, 
  Clock, 
  FileText, 
  CreditCard, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface FastDashboardContentProps {
  onLoanDetailsClick: (loanId: string) => void;
}

export default function FastDashboardContent({ onLoanDetailsClick }: FastDashboardContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading, error, refresh, lastUpdated, cacheAge } = useFastDashboard({
    userId: user?.id || null,
    enabled: !!user,
  });

  // Show loading state only for initial load
  if (loading && !data) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading skeleton for loans */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with fallback
  if (error && !data) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Failed to Load Dashboard
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'In Repayment':
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Pending Approval':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'In Repayment':
        return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900';
      case 'Completed':
        return 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-900';
      case 'Pending Approval':
        return 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
      case 'Rejected':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900';
      default:
        return 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-900';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Cache status indicator */}
      {cacheAge !== null && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
          <span>
            {cacheAge < 60000 
              ? `Data cached ${Math.round(cacheAge / 1000)}s ago` 
              : `Data cached ${Math.round(cacheAge / 60000)}m ago`
            }
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      )}

      {/* Error indicator for stale data */}
      {error && data && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Loan Amount */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Loan Amount</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {formatCurrency(data.stats.totalLoanAmount)}
          </p>
        </div>

        {/* Active Loans */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Loans</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {data.stats.activeLoansCount}
          </p>
        </div>

        {/* Pending Loans */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-950 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {data.stats.pendingLoansCount}
          </p>
        </div>

        {/* Next Payment Due */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Payment Due</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
            {formatDate(data.stats.nextPaymentDue)}
          </p>
        </div>
      </div>

      {/* Recent Loans */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recent Loans</h2>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="p-6">
          {data.recentLoans.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No loans found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Apply for your first loan to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(loan.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">
                        {formatCurrency(loan.loanAmount)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Applied: {formatDate(loan.applicationDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment</p>
                      <p className="font-medium text-gray-900 dark:text-gray-50">
                        {formatCurrency(loan.monthlyPayment)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}