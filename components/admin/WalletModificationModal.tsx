'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, DollarSign, Calculator, Info } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import { validateLoanAmount, validateAdminReason } from '@/lib/validation';

interface WalletModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentWalletBalance: number;
  currentLoanAmount?: number;
  currentMonthlyPayment?: number;
  currentInterestRate?: number;
  currentDurationMonths?: number;
  onSuccess: (updatedData: {
    walletBalance: number;
    loanAmount?: number;
    monthlyPayment?: number;
    totalAmount?: number;
  }) => void;
}

export default function WalletModificationModal({
  isOpen,
  onClose,
  userId,
  currentWalletBalance,
  currentLoanAmount,
  currentMonthlyPayment,
  currentInterestRate,
  currentDurationMonths,
  onSuccess
}: WalletModificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminReason, setAdminReason] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState(currentWalletBalance.toString());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNewWalletBalance(currentWalletBalance.toString());
      setAdminReason('');
      setError(null);
      setFieldErrors({});
      setValidationErrors([]);
    }
  }, [isOpen, currentWalletBalance]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const generalErrors: string[] = [];

    const reasonValidation = validateAdminReason(adminReason);
    if (!reasonValidation.isValid) {
      generalErrors.push(reasonValidation.error!);
    }

    const amountValidation = validateLoanAmount(newWalletBalance);
    if (!amountValidation.isValid) {
      errors.walletBalance = amountValidation.error!;
    }

    const newBalance = parseFloat(newWalletBalance);
    if (isNaN(newBalance) || newBalance < 0) {
      errors.walletBalance = 'Wallet balance must be a valid positive number';
    }

    setFieldErrors(errors);
    setValidationErrors(generalErrors);

    return Object.keys(errors).length === 0 && generalErrors.length === 0;
  };

  const calculateNewInstallment = (newAmount: number): { monthlyPayment: number; totalAmount: number } => {
    if (!currentInterestRate || !currentDurationMonths) {
      return { monthlyPayment: 0, totalAmount: 0 };
    }

    const monthlyInterestRate = currentInterestRate / 100 / 12;
    const monthlyPayment =
      (newAmount *
        (monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, currentDurationMonths))) /
      (Math.pow(1 + monthlyInterestRate, currentDurationMonths) - 1);

    const totalAmount = monthlyPayment * currentDurationMonths;

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before updating.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newBalance = parseFloat(newWalletBalance);
      const response = await adminApi.updateUserWalletBalance(userId, newBalance, adminReason);

      if (response.success) {
        const updatedData: any = {
          walletBalance: newBalance
        };

        // If loan exists, include loan update info
        if (response.loanUpdate) {
          updatedData.loanAmount = response.loanUpdate.newLoanAmount;
          updatedData.monthlyPayment = response.loanUpdate.newMonthlyPayment;
          updatedData.totalAmount = response.loanUpdate.newTotalAmount;
        }

        onSuccess(updatedData);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to update wallet balance.');
      }
    } catch (err: any) {
      console.error('Wallet update error:', err);
      setError(err.message || 'An unexpected error occurred during update.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const newBalanceNum = parseFloat(newWalletBalance) || 0;
  const balanceChange = newBalanceNum - currentWalletBalance;
  const hasLoan = currentLoanAmount !== undefined && currentInterestRate !== undefined && currentDurationMonths !== undefined;
  const newInstallment = hasLoan ? calculateNewInstallment(newBalanceNum) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Modify Wallet Balance
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Updating the wallet balance will automatically update the approved loan amount and recalculate monthly installments.
          The interest rate and duration will remain unchanged.
        </p>

        {/* Current vs New Balance */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Current Balance</label>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(currentWalletBalance)}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">New Balance</label>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(newBalanceNum)}
            </div>
            {balanceChange !== 0 && (
              <div className={`text-xs mt-1 ${balanceChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {balanceChange > 0 ? '+' : ''}{formatCurrency(balanceChange)}
              </div>
            )}
          </div>
        </div>

        {/* Wallet Balance Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Wallet Balance
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-500 dark:text-gray-400">$</span>
            <input
              type="number"
              value={newWalletBalance}
              onChange={(e) => setNewWalletBalance(e.target.value)}
              className={`w-full pl-8 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.walletBalance ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}
              step="0.01"
              min="0"
            />
          </div>
          {fieldErrors.walletBalance && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.walletBalance}
            </p>
          )}
        </div>

        {/* Loan Recalculation Preview */}
        {hasLoan && newInstallment && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                  Loan Will Be Updated
                </h4>
                <div className="space-y-2 text-xs text-yellow-800 dark:text-yellow-400">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-yellow-600 dark:text-yellow-500">Current Loan Amount:</span>
                      <div className="font-medium">{formatCurrency(currentLoanAmount!)}</div>
                    </div>
                    <div>
                      <span className="text-yellow-600 dark:text-yellow-500">New Loan Amount:</span>
                      <div className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(newBalanceNum)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-yellow-200 dark:border-yellow-800">
                    <div>
                      <span className="text-yellow-600 dark:text-yellow-500">Current Monthly Payment:</span>
                      <div className="font-medium">{formatCurrency(currentMonthlyPayment!)}</div>
                    </div>
                    <div>
                      <span className="text-yellow-600 dark:text-yellow-500">New Monthly Payment:</span>
                      <div className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(newInstallment.monthlyPayment)}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                    <span className="text-yellow-600 dark:text-yellow-500">Interest Rate:</span>
                    <span className="ml-2 font-medium">{currentInterestRate}% (unchanged)</span>
                  </div>
                  <div>
                    <span className="text-yellow-600 dark:text-yellow-500">Duration:</span>
                    <span className="ml-2 font-medium">{currentDurationMonths} months (unchanged)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for modification (required)
          </label>
          <textarea
            value={adminReason}
            onChange={(e) => setAdminReason(e.target.value)}
            placeholder="Please provide a detailed reason for modifying the wallet balance (minimum 10 characters)..."
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${adminReason.trim().length > 0 && adminReason.trim().length < 10 ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'}`}
            rows={3}
          />
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {adminReason.trim().length}/10 characters minimum
            </div>
            {adminReason.trim().length > 0 && adminReason.trim().length < 10 && (
              <div className="text-xs text-red-600 dark:text-red-400">
                Reason too short
              </div>
            )}
          </div>
        </div>

        {/* General Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                {validationErrors.map((err, idx) => <li key={idx}>• {err}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* API Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !adminReason.trim() || adminReason.trim().length < 10}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            {loading ? 'Updating...' : 'Update Wallet & Loan'}
          </button>
        </div>
      </div>
    </div>
  );
}

