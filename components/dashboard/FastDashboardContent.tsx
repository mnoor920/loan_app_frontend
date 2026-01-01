/**
 * Optimized dashboard content component with cache-first loading
 */

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFastDashboard } from '@/hooks/useFastDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/loan-calculations';
import { apiFetchJson } from '@/lib/api-client';
import { RefreshCw, AlertCircle, XCircle } from 'lucide-react';
import WalletErrorSuccessMessages from './WalletErrorSuccessMessages';
import LoanInfoCard from './LoanInfoCard';
import WalletBalanceCard from './WalletBalanceCard';
import WithdrawalHistory from './WithdrawalHistory';
import WithdrawalCodeModal from './WithdrawalCodeModal';
import RecentLoans from './RecentLoans';

interface FastDashboardContentProps {
  onLoanDetailsClick: (loanId: string) => void;
}

interface WalletWithdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'review' | 'approved' | 'rejected';
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    accountType: string;
  };
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface LoanInfo {
  id: string;
  loanAmount: number;
  durationMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalAmount: number;
  status: string;
  approvalDate?: string;
  firstPaymentDate?: string;
}

export default function FastDashboardContent({ onLoanDetailsClick }: FastDashboardContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading, error, refresh, lastUpdated, cacheAge } = useFastDashboard({
    userId: user?.id || null,
    enabled: !!user,
  });

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [withdrawalCode, setWithdrawalCode] = useState('');

  // Fetch wallet data
  useEffect(() => {
    if (user && data) {
      fetchWalletData();
    }
  }, [user, data]);

  const fetchWalletData = async () => {
    try {
      setWalletLoading(true);
      setWalletError(null);

      // Fetch user data to get wallet balance
      const userResponse = await apiFetchJson('/api/auth/me');
      if (userResponse.user) {
        setWalletBalance(userResponse.user.walletBalance || 0);
      }

      // Fetch withdrawal history
      try {
        const withdrawalsResponse = await apiFetchJson('/api/wallet/withdrawals');
        if (withdrawalsResponse.success) {
          setWithdrawals(withdrawalsResponse.withdrawals || []);
        }
      } catch (err) {
        console.log('Could not fetch withdrawals:', err);
      }

      // Fetch approved loan information
      if (data && data.recentLoans && data.recentLoans.length > 0) {
        try {
          const loansResponse = await apiFetchJson('/api/loans/user');
          if (loansResponse.success && loansResponse.loans) {
            const approvedLoan = loansResponse.loans.find((loan: any) => loan.status === 'Approved');
            if (approvedLoan) {
              setLoanInfo({
                id: approvedLoan.id,
                loanAmount: approvedLoan.loanAmount,
                durationMonths: approvedLoan.durationMonths,
                interestRate: approvedLoan.interestRate,
                monthlyPayment: approvedLoan.monthlyPayment,
                totalAmount: approvedLoan.totalAmount,
                status: approvedLoan.status,
                approvalDate: approvedLoan.approvalDate,
                firstPaymentDate: approvedLoan.firstPaymentDate
              });
            }
          }
        } catch (err) {
          console.log('Could not fetch loan info:', err);
        }
      }
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setWalletError(err.message || 'Failed to load wallet data');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWithdrawSubmit = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > walletBalance || amount < 0.01) {
      setWalletError('Please enter a valid amount for withdrawal.');
      return;
    }
    setWalletError(null);
    setWalletSuccess(null);
    setShowWithdrawForm(false);
    setShowCodeModal(true);
  };

  const handleWithdraw = async () => {
    const trimmedCode = withdrawalCode.trim();
    if (!trimmedCode || trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      setWalletError('Please enter a valid 6-digit code');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    try {
      setWithdrawing(true);
      setWalletError(null);
      setWalletSuccess(null);

      const response = await apiFetchJson('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, code: trimmedCode })
      });

      if (response.success) {
        setWalletSuccess(`Withdrawal request of ${formatCurrency(amount)} submitted successfully!`);
        setWithdrawAmount('');
        setWithdrawalCode('');
        setShowCodeModal(false);
        setShowWithdrawForm(false);
        await fetchWalletData();
      } else {
        let errorMessage = response.error || response.message || 'Failed to process withdrawal';
        if (errorMessage.includes('Invalid') && errorMessage.includes('code')) {
          errorMessage = 'Invalid verification code. Please contact admin to generate a new code.';
        } else if (errorMessage.includes('already been used') || errorMessage.includes('already used')) {
          errorMessage = 'This verification code has already been used. Please contact admin to generate a new code.';
        } else if (errorMessage.includes('belongs to a different user')) {
          errorMessage = 'This code belongs to a different user. Please contact admin to generate a new code.';
        }
        setWalletError(errorMessage);
      }
    } catch (err: any) {
      console.error('Error processing withdrawal:', err);
      let errorMessage = err.error || err.message || 'Failed to process withdrawal';
      if (errorMessage.includes('Invalid') && errorMessage.includes('code')) {
        errorMessage = 'Invalid verification code. Please contact admin to generate a new code.';
      } else if (errorMessage.includes('already been used') || errorMessage.includes('already used')) {
        errorMessage = 'This verification code has already been used. Please contact admin to generate a new code.';
      } else if (errorMessage.includes('belongs to a different user')) {
        errorMessage = 'This code belongs to a different user. Please contact admin to generate a new code.';
      } else if (errorMessage.includes('Internal Server Error') || errorMessage.includes('Internal server error')) {
        errorMessage = 'An error occurred while processing your withdrawal. Please try again or contact support.';
      }
      setWalletError(errorMessage);
    } finally {
      setWithdrawing(false);
    }
  };



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


      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      
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
      </div> */}

      {/* Wallet Section */}
      <div className="space-y-6">
        <WalletErrorSuccessMessages
          error={walletError}
          success={walletSuccess}
          onDismissError={() => setWalletError(null)}
          onDismissSuccess={() => setWalletSuccess(null)}
        />

        {loanInfo && <LoanInfoCard loanInfo={loanInfo} />}

        <WalletBalanceCard
          walletBalance={walletBalance}
          withdrawAmount={withdrawAmount}
          showWithdrawForm={showWithdrawForm}
          withdrawing={withdrawing}
          onWithdrawFull={() => {
            setWithdrawAmount(walletBalance.toString());
            setShowWithdrawForm(true);
          }}
          onWithdrawPartial={() => {
            setWithdrawAmount('');
            setShowWithdrawForm(true);
          }}
          onAmountChange={(amount) => setWithdrawAmount(amount)}
          onCancel={() => {
            setShowWithdrawForm(false);
            setWithdrawAmount('');
            setWalletError(null);
          }}
          onSubmit={handleWithdrawSubmit}
        />

        <WithdrawalHistory
          withdrawals={withdrawals}
          onRefresh={fetchWalletData}
        />
      </div>

      <WithdrawalCodeModal
        isOpen={showCodeModal}
        withdrawAmount={withdrawAmount}
        withdrawalCode={withdrawalCode}
        withdrawing={withdrawing}
        error={walletError}
        onCodeChange={(code) => setWithdrawalCode(code)}
        onClose={() => {
          setShowCodeModal(false);
          setWithdrawalCode('');
          setWalletError(null);
        }}
        onSubmit={handleWithdraw}
      />

      <RecentLoans
        loans={data.recentLoans}
        loading={loading}
        onRefresh={refresh}
        onLoanClick={onLoanDetailsClick}
      />
    </div>
  );
}