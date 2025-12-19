import React, { useState, useEffect } from 'react';
import { X, Key, Copy, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '../../lib/api-client';

interface GenerateWalletCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userName: string;
}

export default function GenerateWalletCodeModal({ isOpen, onClose, userId, userName }: GenerateWalletCodeModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingCode, setFetchingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Fetch existing code when modal opens
  useEffect(() => {
    const fetchExistingCode = async () => {
      if (isOpen && userId && !generatedCode) {
        setFetchingCode(true);
        try {
          const response = await adminApi.getWalletWithdrawalCode(userId);
          if (response.success && response.code) {
            setGeneratedCode(response.code);
            if (response.isUsed) {
              setError('This code has already been used. Generate a new one to proceed.');
            }
          }
        } catch (err) {
          // No code exists yet, which is fine
          console.log('No existing code found:', err);
        } finally {
          setFetchingCode(false);
        }
      }
    };

    fetchExistingCode();
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.generateWalletWithdrawalCode(userId);
      if (response.success && response.code) {
        setGeneratedCode(response.code);
        setManualMode(false);
      } else {
        throw new Error(response.message || 'Failed to generate code');
      }
    } catch (err: any) {
      console.error('Code generation error:', err);
      setError(err.message || 'Failed to generate. Try manual entry?');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (manualCode.length === 6) {
      setLoading(true);
      setError(null);
      try {
        const response = await adminApi.setWalletWithdrawalCode(userId, manualCode);
        if (response.success) {
          setGeneratedCode(manualCode);
          setManualMode(false);
        } else {
          throw new Error(response.message || 'Failed to set code');
        }
      } catch (err: any) {
        console.error('Manual set error:', err);
        setError(err.message || 'Failed to set code');
      } finally {
        setLoading(false);
      }
    } else {
      setError("Code must be 6 digits");
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setGeneratedCode(null);
    setError(null);
    setCopied(false);
    setManualMode(false);
    setManualCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Wallet Withdrawal Code</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate a <strong className="text-blue-600 dark:text-blue-400">wallet withdrawal code</strong> for <span className="font-semibold text-gray-900 dark:text-gray-100">{userName}</span>
            </p>
            <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This is for wallet withdrawals. Loan withdrawal codes are different and cannot be used for wallet withdrawals.
              </p>
            </div>
          </div>

          {!generatedCode && !manualMode && (
            <div className="space-y-4">
              <button
                onClick={handleGenerate}
                disabled={loading || fetchingCode}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    Generate Code
                  </>
                )}
              </button>

              <button
                onClick={() => setManualMode(true)}
                className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Enter Code Manually
              </button>
            </div>
          )}

          {manualMode && !generatedCode && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setManualMode(false);
                    setManualCode('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={loading || manualCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Setting...' : 'Set Code'}
                </button>
              </div>
            </div>
          )}

          {generatedCode && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Withdrawal Code Generated</p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-widest font-mono">
                    {generatedCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Share this code with the user to complete their withdrawal
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

