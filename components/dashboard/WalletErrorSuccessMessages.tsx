'use client';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface WalletErrorSuccessMessagesProps {
  error: string | null;
  success: string | null;
  onDismissError: () => void;
  onDismissSuccess: () => void;
}

export default function WalletErrorSuccessMessages({
  error,
  success,
  onDismissError,
  onDismissSuccess,
}: WalletErrorSuccessMessagesProps) {
  return (
    <>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
          <button
            onClick={onDismissError}
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
            onClick={onDismissSuccess}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}

