'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import ErrorDisplay from '@/components/error/ErrorDisplay';
import useErrorHandler from '@/hooks/useErrorHandler';
import { adminApi } from '@/lib/api-client';
import { SkeletonList, InlineLoading, RefreshIndicator } from '@/components/ui/LoadingStates';
import Pagination from '@/components/ui/Pagination';

interface ActivatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  activationStatus: 'completed' | 'pending' | 'in_progress';
  activatedAt: string;
  createdAt: string;
  profile?: {
    id: string;
    fullName: string;
    currentStep: number;
    completedAt?: string;
  };
}

interface UsersListProps {
  className?: string;
}

export default function UsersList({ className = '' }: UsersListProps) {
  const router = useRouter();
  
  // Data states
  const [users, setUsers] = useState<ActivatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const usersPerPage = 20;

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
      console.error('Users list error:', error);
    }
  });

  // Fetch users with enhanced error handling
  const fetchUsers = async (page: number = 1, search: string = '', status: string = 'all') => {
    setLoading(true);
    clearError();
    
    const result = await executeWithErrorHandling(
      () => adminApi.getActivatedUsers({
        limit: usersPerPage,
        offset: (page - 1) * usersPerPage,
        search: search || undefined,
        status: status !== 'all' ? status : undefined
      }),
      'fetch_users'
    );
    
    if (result && result.success) {
      setUsers(result.users || []);
      setTotalUsers(result.total || 0);
      setHasMore(result.pagination?.hasMore || false);
    }
    
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    fetchUsers(1, searchQuery, statusFilter);
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchUsers(1, query, statusFilter);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchUsers(1, searchQuery, status);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page, searchQuery, statusFilter);
  };

  // Helper functions
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 inline-flex text-xs font-semibold rounded-full border";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
      case 'in_progress':
        return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
      case 'pending':
        return `${baseClasses} bg-slate-100 text-slate-700 border-slate-200`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700 border-slate-200`;
    }
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All Users</h2>
              <p className="text-sm text-slate-500 mt-1">
                {loading ? (
                  <InlineLoading message="Loading users..." size="sm" />
                ) : totalUsers > 0 ? (
                  `${totalUsers} total users`
                ) : (
                  'Manage user accounts and activation status'
                )}
              </p>
            </div>
            {!loading && (
              <RefreshIndicator
                isRefreshing={loading}
                onRefresh={() => fetchUsers(currentPage, searchQuery, statusFilter)}
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
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
            onRetry={() => retry(() => fetchUsers(currentPage, searchQuery, statusFilter))}
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
        ) : users.length > 0 ? (
          <>
            {/* Users List */}
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarColor(user.profile?.fullName || `${user.firstName} ${user.lastName}`)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                    {getInitials(user.profile?.fullName || `${user.firstName} ${user.lastName}`)}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {user.profile?.fullName || `${user.firstName} ${user.lastName}`}
                      </h3>
                      {getStatusIcon(user.activationStatus)}
                    </div>
                    <p className="text-xs text-slate-600 truncate">{user.email}</p>
                    {user.phone && (
                      <p className="text-xs text-slate-500">{user.phone}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                      <span>Joined: {formatDate(user.createdAt)}</span>
                      {user.activationStatus === 'completed' && user.profile?.completedAt && (
                        <span>Activated: {formatDate(user.profile.completedAt)}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-2">
                    <span className={getStatusBadge(user.activationStatus)}>
                      {user.activationStatus === 'in_progress' ? 'In Progress' : 
                       user.activationStatus.charAt(0).toUpperCase() + user.activationStatus.slice(1)}
                    </span>
                    
                    {/* Action Button */}
                    <button
                      onClick={() => router.push(`/adminusers/${user.id}`)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                    >
                      View Profile
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
                  totalItems={totalUsers}
                  itemsPerPage={usersPerPage}
                  onPageChange={handlePageChange}
                  showInfo={true}
                  showSizeSelector={true}
                  pageSizeOptions={[10, 20, 50, 100]}
                  onPageSizeChange={(newSize) => {
                    // Update users per page and reset to first page
                    setCurrentPage(1);
                    fetchUsers(1, searchQuery, statusFilter);
                  }}
                />
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Users Found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No users have been registered yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}