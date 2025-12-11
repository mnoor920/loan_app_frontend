import React, { useState } from 'react';
import { X, Key, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { adminApi } from '../../lib/api-client';

interface GenerateCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
  applicantName: string;
}

export default function GenerateCodeModal({ isOpen, onClose, loanId, applicantName }: GenerateCodeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  if (!isOpen || !loanId) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.generateWithdrawalCode(loanId);
      if (response.success && response.code) {
        setGeneratedCode(response.code);
        setManualMode(false);
      } else {
        throw new Error(response.message || 'Failed to generate code');
      }
    } catch (err: any) {
      console.error('Code generation error:', err);
      // Fallback to manual mode suggestion if API fails
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
              const response = await adminApi.setWithdrawalCode(loanId, manualCode);
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Withdrawal Code</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Generate or manually enter a verification code for <strong>{applicantName}</strong>.
          </p>

          {!generatedCode ? (
            <div className="space-y-6">
              
              {!manualMode ? (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                        <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Security Note</p>
                        <p className="text-blue-600 dark:text-blue-300 text-xs">
                            This code enables immediate withdrawal.
                        </p>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                        <>
                            <Key className="w-5 h-5" />
                            Generate Automatically
                        </>
                        )}
                    </button>
                    
                    <button
                        onClick={() => { setManualMode(true); setError(null); }} // Clear error when switching to manual mode
                        className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                    >
                        Enter Code Manually
                    </button>
                  </>
              ) : (
                  <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enter 6-digit Code</label>
                        <input 
                            type="text" 
                            maxLength={6}
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-mono tracking-widest text-center"
                            placeholder="000000"
                        />
                      </div>
                      {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                      )}
                      <div className="flex gap-3">
                        <button
                            onClick={() => { setManualMode(false); setError(null); }} // Clear error when canceling manual mode
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleManualSubmit}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Set Code
                        </button>
                      </div>
                  </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Verification Code</p>
                <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white tracking-[0.2em]">
                  {generatedCode}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:text-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
