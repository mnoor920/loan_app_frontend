'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, DollarSign, ArrowLeft, History, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, CreditCard, Calendar, Percent, Key } from 'lucide-react';
import DashboardLayout from '../../components/ui/dashboardlayout';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetchJson } from '../../lib/api-client';

interface WalletWithdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    accountType: string;
  };
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

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [withdrawalCode, setWithdrawalCode] = useState('');

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data to get wallet balance
      const userResponse = await apiFetchJson('/api/auth/me');
      if (userResponse.user) {
        setWalletBalance(userResponse.user.walletBalance || 0);
      } else if (userResponse.error) {
        // If there's an error, still try to continue (wallet balance will be 0)
        console.warn('Could not fetch user data:', userResponse.error);
      }

      // Fetch withdrawal history
      const withdrawalsResponse = await apiFetchJson('/api/wallet/withdrawals');
      if (withdrawalsResponse.success) {
        setWithdrawals(withdrawalsResponse.withdrawals || []);
      }

      // Fetch approved loan information
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
        // Loan fetch is optional, don't fail if it errors
        console.log('Could not fetch loan info:', err);
      }
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = () => {
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > walletBalance) {
      setError(`Insufficient balance. Available: ${formatCurrency(walletBalance)}`);
      return;
    }

    if (amount < 0.01) {
      setError('Minimum withdrawal amount is 0.01');
      return;
    }

    // Close amount form and show code modal
    setShowWithdrawForm(false);
    setShowCodeModal(true);
    setError(null);
  };

  const handleWithdraw = async () => {
    const trimmedCode = withdrawalCode.trim();
    if (!trimmedCode || trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    const amount = parseFloat(withdrawAmount);

    try {
      setWithdrawing(true);
      setError(null);
      setSuccess(null);

      const response = await apiFetchJson('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, code: trimmedCode })
      });

      if (response.success) {
        setSuccess(`Withdrawal request of ${formatCurrency(amount)} submitted successfully!`);
        setWithdrawAmount('');
        setWithdrawalCode('');
        setShowCodeModal(false);
        setShowWithdrawForm(false);
        // Refresh wallet data
        await fetchWalletData();
      } else {
        // Extract error message from response
        let errorMessage = response.error || response.message || 'Failed to process withdrawal';

        // Provide helpful messages for common errors
        if (errorMessage.includes('Invalid') && errorMessage.includes('code')) {
          errorMessage = 'Invalid verification code. Please contact admin to generate a new code.';
        } else if (errorMessage.includes('already been used') || errorMessage.includes('already used')) {
          errorMessage = 'This verification code has already been used. Please contact admin to generate a new code.';
        } else if (errorMessage.includes('belongs to a different user')) {
          errorMessage = 'This code belongs to a different user. Please contact admin to generate a new code.';
        } else if (errorMessage.includes('Database error')) {
          errorMessage = 'Database error occurred. Please try again or contact support.';
        }

        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('Error processing withdrawal:', err);

      // Handle different error types
      let errorMessage = 'Failed to process withdrawal';

      // Try to extract error from response
      if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Provide helpful messages for common errors
      if (errorMessage.includes('Invalid') && errorMessage.includes('code')) {
        errorMessage = 'Invalid verification code. Please contact admin to generate a new code.';
      } else if (errorMessage.includes('already been used') || errorMessage.includes('already used')) {
        errorMessage = 'This verification code has already been used. Please contact admin to generate a new code.';
      } else if (errorMessage.includes('belongs to a different user')) {
        errorMessage = 'This code belongs to a different user. Please contact admin to generate a new code.';
      } else if (errorMessage.includes('Internal Server Error') || errorMessage.includes('Internal server error')) {
        errorMessage = 'An error occurred while processing your withdrawal. Please try again or contact support.';
      }

      setError(errorMessage);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawFull = () => {
    setWithdrawAmount(walletBalance.toString());
    setShowWithdrawForm(true);
  };

  const handleWithdrawPartial = () => {
    setWithdrawAmount('');
    setShowWithdrawForm(true);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'failed':
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userName={user?.firstName || 'User'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
          </div>
        </div>
      </DashboardLayout>

    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout userName={user?.firstName || 'User'}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              My Wallet
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your wallet balance and withdrawal history
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Success</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loan Information Card */}
        {loanInfo && (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Approved Loan Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium">Loan Amount</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(loanInfo.loanAmount)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Monthly Payment</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(loanInfo.monthlyPayment)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {loanInfo.durationMonths} months
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Percent className="w-4 h-4" />
                  <span className="text-xs font-medium">Interest Rate</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {loanInfo.interestRate}%
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium">Total Amount</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(loanInfo.totalAmount)}
                </p>
              </div>
            </div>
            {loanInfo.firstPaymentDate && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">First Payment Date:</span>{' '}
                  {new Date(loanInfo.firstPaymentDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium">Available Balance</p>
                <p className="text-3xl md:text-4xl font-bold mt-1">
                  {formatCurrency(walletBalance)}
                </p>
              </div>
            </div>
          </div>

          {walletBalance > 0 && !showWithdrawForm && (
            <div className="flex gap-3">
              <button
                onClick={handleWithdrawFull}
                className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors backdrop-blur-sm"
              >
                Withdraw Full Amount
              </button>
              <button
                onClick={handleWithdrawPartial}
                className="flex-1 px-4 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                Withdraw Partial Amount
              </button>
            </div>
          )}

          {showWithdrawForm && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={walletBalance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-blue-100 mt-1">
                    Available: {formatCurrency(walletBalance)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowWithdrawForm(false);
                      setWithdrawAmount('');
                      setError(null);
                    }}
                    className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                    disabled={withdrawing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdrawSubmit}
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="flex-1 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {walletBalance === 0 && (
            <p className="text-blue-100 text-sm mt-4">
              Your wallet is empty. Funds will appear here after loan withdrawals or other transactions.
            </p>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Withdrawal History
                </h2>
              </div>
              <button
                onClick={fetchWalletData}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {withdrawals.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No withdrawal history yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bank Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDate(withdrawal.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(withdrawal.status)}>
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <p className="font-medium">{withdrawal.bankDetails.bankName}</p>
                          <p className="text-xs text-gray-500">
                            {withdrawal.bankDetails.accountType} • {withdrawal.bankDetails.accountNumber.slice(-4)}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Withdrawal Code Modal */}
        {showCodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Enter Verification Code</h2>
                <button
                  onClick={() => {
                    setShowCodeModal(false);
                    setWithdrawalCode('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={withdrawing}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleWithdraw();
                  }}
                  className="space-y-6"
                >
                  {/* Info Box */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                    <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Enter the 6-digit verification code provided by the admin.</p>
                      <p className="text-blue-600 dark:text-blue-300 text-xs">Call support if you haven't received a code.</p>
                    </div>
                  </div>

                  {/* Amount Display */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Withdrawal Amount</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(parseFloat(withdrawAmount) || 0)}
                    </p>
                  </div>

                  {/* Code Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={withdrawalCode}
                        onChange={(e) => setWithdrawalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCodeModal(false);
                        setWithdrawalCode('');
                        setError(null);
                      }}
                      className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                      disabled={withdrawing}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={withdrawing || withdrawalCode.length !== 6}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {withdrawing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Verify & Withdraw'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


