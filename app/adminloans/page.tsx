'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/dashboardlayout';
import { CreditCard, Search, Filter, Eye, Edit, CheckCircle, XCircle, TrendingUp, Clock, DollarSign, FileText } from 'lucide-react';

interface LoanApplication {
  id: string;
  applicationNumber: string;
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
  };
  loanAmount: number;
  loanPurpose: string;
  status: string;
  applicationDate: string;
  interestRate?: number;
  loanDuration?: number;
}

export default function AdminLoansPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Check authentication and admin role
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      router.push('/userdashboard');
      return;
    }
  }, [user, authLoading, router]);

  // Fetch loans
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/loans/all', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // Transform the data to match the expected interface
          const transformedLoans = (data.loans || []).map((loan: any) => ({
            id: loan.id,
            applicationNumber: loan.applicationNumber || loan.application_number || `APP-${loan.id.slice(0, 8)}`,
            applicant: {
              firstName: loan.applicant?.firstName || loan.users?.first_name || 'Unknown',
              lastName: loan.applicant?.lastName || loan.users?.last_name || 'User',
              email: loan.applicant?.email || loan.users?.email || 'No email'
            },
            loanAmount: loan.loanAmount || loan.loan_amount || 0,
            loanPurpose: loan.loanPurpose || loan.loan_purpose || 'Not specified',
            status: loan.status || 'pending',
            applicationDate: loan.applicationDate || loan.application_date || loan.createdAt || loan.created_at,
            interestRate: loan.interestRate || loan.interest_rate,
            loanDuration: loan.loanDuration || loan.loan_duration || loan.durationMonths || loan.duration_months
          }));
          setLoans(transformedLoans);
        } else {
          console.error('Failed to fetch loans');
        }
      } catch (error) {
        console.error('Error fetching loans:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLoans();
    }
  }, [user]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-800 border-t-blue-600 dark:border-t-blue-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-indigo-400 dark:border-t-indigo-600 animate-spin mx-auto" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or not admin
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.applicant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         loan.applicant.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         loan.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || loan.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/50';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/50';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50';
    }
  };

  const handleStatusUpdate = async (loanId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/loans/${loanId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh loans list
        setLoans(loans.map(loan => 
          loan.id === loanId ? { ...loan, status: newStatus } : loan
        ));
      } else {
        console.error('Failed to update loan status');
      }
    } catch (error) {
      console.error('Error updating loan status:', error);
    }
  };

  // Calculate statistics
  const stats = {
    total: loans.length,
    pending: loans.filter(l => l.status === 'pending').length,
    approved: loans.filter(l => l.status === 'approved').length,
    totalAmount: loans.reduce((sum, loan) => sum + loan.loanAmount, 0)
  };

  return (
    <DashboardLayout userName={user?.firstName || 'Admin'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Loan Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and review all loan applications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/30 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-900 dark:to-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{stats.approved}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/30 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or application number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-gray-100 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3 sm:min-w-[200px]">
              <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-gray-100 transition-all cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-800 border-t-blue-600 dark:border-t-blue-500 mx-auto mb-4"></div>
                <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-indigo-400 dark:border-t-indigo-600 animate-spin" style={{ animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading applications...</p>
            </div>
          ) : filteredLoans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Application
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            #{loan.applicationNumber}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {loan.loanPurpose || 'Not specified'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {loan.applicant.firstName} {loan.applicant.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {loan.applicant.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(loan.loanAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(loan.status)}`}>
                          {loan.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(loan.applicationDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => router.push(`/adminloans/${loan.id}`)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {loan.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(loan.id, 'approved')}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(loan.id, 'rejected')}
                                className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <CreditCard className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No loan applications found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && filteredLoans.length > 0 && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredLoans.length} of {loans.length} applications
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}