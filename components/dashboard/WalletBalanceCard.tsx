'use client';
import { Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/loan-calculations';

interface WalletBalanceCardProps {
  walletBalance: number;
  withdrawAmount: string;
  showWithdrawForm: boolean;
  withdrawing: boolean;
  onWithdrawFull: () => void;
  onWithdrawPartial: () => void;
  onAmountChange: (amount: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function WalletBalanceCard({
  walletBalance,
  withdrawAmount,
  showWithdrawForm,
  withdrawing,
  onWithdrawFull,
  onWithdrawPartial,
  onAmountChange,
  onCancel,
  onSubmit,
}: WalletBalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
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
            onClick={onWithdrawFull}
            className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors backdrop-blur-sm"
          >
            Withdraw Full Amount
          </button>
          <button
            onClick={onWithdrawPartial}
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">PKR</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  placeholder="Enter amount"
                  className={`w-full pl-12 pr-4 py-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:outline-none ${withdrawAmount &&
                    !isNaN(parseFloat(withdrawAmount)) &&
                    parseFloat(withdrawAmount) > walletBalance
                    ? 'border-2 border-red-500 focus:ring-red-500'
                    : 'focus:ring-blue-500'
                    }`}
                />
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Available: {formatCurrency(walletBalance)}
              </p>
              {withdrawAmount &&
                !isNaN(parseFloat(withdrawAmount)) &&
                parseFloat(withdrawAmount) > walletBalance && (
                  <div className="mt-2 flex items-center gap-2 text-red-300 text-sm bg-red-500/20 rounded-lg p-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Amount cannot exceed available balance of {formatCurrency(walletBalance)}</span>
                  </div>
                )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                disabled={withdrawing}
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > walletBalance ||
                  withdrawing
                }
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
  );
}

