import React, { useState } from 'react';
import { X, Key, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import WithdrawalReceipt from './WithdrawalReceipt';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
  onSuccess?: () => void;
}

export default function WithdrawModal({ isOpen, onClose, loanId, onSuccess }: WithdrawModalProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  if (!isOpen || !loanId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!code || code.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      const response = await fetch(`/api/loans/${loanId}/withdraw`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit withdrawal request');
      }

      setReceiptData(data.receipt);
      if (onSuccess) onSuccess();

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
      setReceiptData(null);
      setCode('');
      setError(null);
      onClose();
  }

  if (receiptData) {
      return <WithdrawalReceipt data={receiptData} onClose={handleClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Withdraw Application</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Enter the 6-digit verification code provided by the admin.</p>
                  <p className="text-blue-600 dark:text-blue-300 text-xs">Call support if you haven't received a code.</p>
                </div>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
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
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
