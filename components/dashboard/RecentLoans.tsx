'use client';
import { FileText, RefreshCw, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/loan-calculations';

interface Loan {
  id: string;
  loanAmount: number;
  monthlyPayment: number;
  status: string;
  applicationDate: string;
}

interface RecentLoansProps {
  loans: Loan[];
  loading: boolean;
  onRefresh: () => void;
  onLoanClick?: (loanId: string) => void;
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

const formatLoanDate = (dateString: string | null) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function RecentLoans({ loans, loading, onRefresh, onLoanClick }: RecentLoansProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recent Loans</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="p-6">
        {loans.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No loans found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Apply for your first loan to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div
                key={loan.id}
                onClick={() => onLoanClick?.(loan.id)}
                className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                  onLoanClick ? 'cursor-pointer' : ''
                }`}
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
                      Applied: {formatLoanDate(loan.applicationDate)}
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
  );
}

