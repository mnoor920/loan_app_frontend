'use client';
import { XCircle, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/loan-calculations';

interface WithdrawalCodeModalProps {
  isOpen: boolean;
  withdrawAmount: string;
  withdrawalCode: string;
  withdrawing: boolean;
  error: string | null;
  onCodeChange: (code: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function WithdrawalCodeModal({
  isOpen,
  withdrawAmount,
  withdrawalCode,
  withdrawing,
  error,
  onCodeChange,
  onClose,
  onSubmit,
}: WithdrawalCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Enter Verification Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={withdrawing}
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="space-y-6"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Enter the 6-digit verification code provided by the admin.</p>
                <p className="text-blue-600 dark:text-blue-300 text-xs">Call support if you haven't received a code.</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Withdrawal Amount</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(parseFloat(withdrawAmount) || 0)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={withdrawalCode}
                onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
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
  );
}

