'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign
} from 'lucide-react';
import ErrorDisplay from '@/components/error/ErrorDisplay';
import useErrorHandler from '@/hooks/useErrorHandler';
import { adminApi } from '@/lib/api-client';
import { SkeletonList, InlineLoading, RefreshIndicator } from '@/components/ui/LoadingStates';
import Pagination from '@/components/ui/Pagination';

interface LoanApplicationWithUser {
  id: string;
  userId: string;
  loanAmount: number;
  durationMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalAmount: number;
  status: 'Pending Approval' | 'Approved' | 'In Repayment' | 'Completed' | 'Rejected';
  applicationDate: string;
  approvalDate?: string;
  firstPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

interface LoansListProps {
  className?: string;
}

export default function LoansList({ className = '' }: LoansListProps) {
  const router = useRouter();
  
  // Data states
  const [loans, setLoans] = useState<LoanApplicationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('application_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLoans, setTotalLoans] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const loansPerPage = 20;

  // Enhanced error handling
  const {
    error,
    hasError,
    isRetrying,
    canRetry,
    retryCount,
    handleError,
    clearError,
    retry,
    executeWithErrorHandling
  } = useErrorHandler({
    maxRetries: 3,
    onError: (error) => {
      console.error('Loans list error:', error);
    }
  });

  // Fetch loans with enhanced error handling
  const fetchLoans = async (
    page: number = 1, 
    search: string = '', 
    status: string = 'all',
    sort: string = 'application_date',
    order: string = 'desc'
  ) => {
    setLoading(true);
    clearError();
    
    const result = await executeWithErrorHandling(
      () => adminApi.getAllLoans({
        limit: loansPerPage,
        offset: (page - 1) * loansPerPage,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        sortBy: sort,
        sortOrder: order
      }),
      'fetch_loans'
    );
    
    if (result && result.success) {
      setLoans(result.loans || []);
      setTotalLoans(result.total || 0);
      setHasMore(result.pagination?.hasMore || false);
    }
    
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    fetchLoans(1, searchQuery, statusFilter, sortBy, sortOrder);
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchLoans(1, query, statusFilter, sortBy, sortOrder);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchLoans(1, searchQuery, status, sortBy, sortOrder);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
    fetchLoans(1, searchQuery, statusFilter, field, newOrder);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchLoans(page, searchQuery, statusFilter, sortBy, sortOrder);
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 inline-flex text-xs font-semibold rounded-full";
    switch (status) {
      case 'Approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'In Repayment':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'Completed':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
      case 'Pending Approval':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'Rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
    }
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return (firstName[0] + lastName[0]).toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const totalPages = Math.ceil(totalLoans / loansPerPage);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">All Loan Applications</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {loading ? (
                  <InlineLoading message="Loading applications..." size="sm" />
                ) : totalLoans > 0 ? (
                  `${totalLoans} total applications`
                ) : (
                  'Review and manage loan applications'
                )}
              </p>
            </div>
            {!loading && (
              <RefreshIndicator
                isRefreshing={loading}
                onRefresh={() => fetchLoans(currentPage, searchQuery, statusFilter, sortBy, sortOrder)}
              />
            )}
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="Pending Approval">Pending</option>
                <option value="Approved">Approved</option>
                <option value="In Repayment">In Repayment</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {hasError && error && (
          <ErrorDisplay
            error={error}
            onRetry={() => retry(() => fetchLoans(currentPage, searchQuery, statusFilter, sortBy, sortOrder))}
            onDismiss={clearError}
            canRetry={canRetry}
            isRetrying={isRetrying}
            retryCount={retryCount}
            maxRetries={3}
            className="mb-6"
            variant="banner"
          />
        )}

        {loading ? (
          /* Enhanced Loading State */
          <SkeletonList count={10} showAvatar={true} />
        ) : loans.length > 0 ? (
          <>
            {/* Loans List */}
            <div className="space-y-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarColor(`${loan.applicant.firstName} ${loan.applicant.lastName}`)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                    {getInitials(loan.applicant.firstName, loan.applicant.lastName)}
                  </div>
                  
                  {/* Loan Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {loan.applicant.firstName} {loan.applicant.lastName}
                      </h3>
                      {getStatusIcon(loan.status)}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{loan.applicant.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(loan.loanAmount)}
                      </span>
                      <span>{loan.durationMonths} months</span>
                      <span>Applied: {formatDate(loan.applicationDate)}</span>
                    </div>
                  </div>
                  
                  {/* Status and Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <span className={getStatusBadge(loan.status)}>
                      {loan.status}
                    </span>
                    
                    {/* Action Button */}
                    <button
                      onClick={() => router.push(`/adminloans/${loan.id}`)}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalLoans}
                  itemsPerPage={loansPerPage}
                  onPageChange={handlePageChange}
                  showInfo={true}
                  showSizeSelector={true}
                  pageSizeOptions={[10, 20, 50, 100]}
                  onPageSizeChange={(newSize) => {
                    // Update loans per page and reset to first page
                    setCurrentPage(1);
                    fetchLoans(1, searchQuery, statusFilter, sortBy, sortOrder);
                  }}
                />
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Loan Applications Found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No loan applications have been submitted yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}