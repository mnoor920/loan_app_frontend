'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, DollarSign, Calendar, Percent } from 'lucide-react';

interface ApproveLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (data: {
    approvedAmount?: number;
    approvedDurationMonths?: number;
    approvedInterestRate?: number;
    reason: string;
  }) => Promise<void>;
  originalLoan: {
    loanAmount: number;
    durationMonths: number;
    interestRate: number;
  };
  loading?: boolean;
}

export default function ApproveLoanModal({
  isOpen,
  onClose,
  onApprove,
  originalLoan,
  loading = false
}: ApproveLoanModalProps) {
  const [approvedAmount, setApprovedAmount] = useState(originalLoan.loanAmount.toString());
  const [approvedDuration, setApprovedDuration] = useState(originalLoan.durationMonths.toString());
  const [approvedInterestRate, setApprovedInterestRate] = useState(originalLoan.interestRate.toString());
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setApprovedAmount(originalLoan.loanAmount.toString());
      setApprovedDuration(originalLoan.durationMonths.toString());
      setApprovedInterestRate(originalLoan.interestRate.toString());
      setReason('');
      setErrors({});
    }
  }, [isOpen, originalLoan]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const amount = parseFloat(approvedAmount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (amount > 1000000) {
      newErrors.amount = 'Amount cannot exceed $1,000,000';
    }

    const duration = parseInt(approvedDuration);
    if (isNaN(duration) || duration <= 0) {
      newErrors.duration = 'Duration must be a positive number';
    } else if (duration > 360) {
      newErrors.duration = 'Duration cannot exceed 360 months';
    }

    const rate = parseFloat(approvedInterestRate);
    if (isNaN(rate) || rate < 0) {
      newErrors.interestRate = 'Interest rate must be non-negative';
    } else if (rate > 50) {
      newErrors.interestRate = 'Interest rate cannot exceed 50%';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Approval reason is required';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = async () => {
    if (!validate()) return;

    const amount = parseFloat(approvedAmount);
    const duration = parseInt(approvedDuration);
    const rate = parseFloat(approvedInterestRate);

    const approvalData: any = {
      reason: reason.trim()
    };

    // Only include changed values
    if (amount !== originalLoan.loanAmount) {
      approvalData.approvedAmount = amount;
    }
    if (duration !== originalLoan.durationMonths) {
      approvalData.approvedDurationMonths = duration;
    }
    if (rate !== originalLoan.interestRate) {
      approvalData.approvedInterestRate = rate;
    }

    await onApprove(approvalData);
  };

  if (!isOpen) return null;

  const amountChanged = parseFloat(approvedAmount) !== originalLoan.loanAmount;
  const durationChanged = parseInt(approvedDuration) !== originalLoan.durationMonths;
  const rateChanged = parseFloat(approvedInterestRate) !== originalLoan.interestRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Approve Loan</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You can modify the loan amount, duration, or interest rate before approving. Leave unchanged to approve with original values.
            </p>
          </div>

          {/* Loan Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Approved Loan Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={approvedAmount}
                onChange={(e) => {
                  setApprovedAmount(e.target.value);
                  if (errors.amount) delete errors.amount;
                }}
                className={`w-full pl-8 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'
                } ${amountChanged ? 'ring-2 ring-yellow-400' : ''}`}
                placeholder="Enter amount"
              />
            </div>
            {amountChanged && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Changed from {originalLoan.loanAmount.toLocaleString()}
              </p>
            )}
            {errors.amount && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Loan Duration (Months)
            </label>
            <input
              type="number"
              value={approvedDuration}
              onChange={(e) => {
                setApprovedDuration(e.target.value);
                if (errors.duration) delete errors.duration;
              }}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                errors.duration ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'
              } ${durationChanged ? 'ring-2 ring-yellow-400' : ''}`}
              placeholder="Enter duration"
            />
            {durationChanged && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Changed from {originalLoan.durationMonths} months
              </p>
            )}
            {errors.duration && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.duration}
              </p>
            )}
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Percent className="w-4 h-4 inline mr-1" />
              Interest Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={approvedInterestRate}
                onChange={(e) => {
                  setApprovedInterestRate(e.target.value);
                  if (errors.interestRate) delete errors.interestRate;
                }}
                className={`w-full pr-8 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                  errors.interestRate ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'
                } ${rateChanged ? 'ring-2 ring-yellow-400' : ''}`}
                placeholder="Enter rate"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            {rateChanged && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Changed from {originalLoan.interestRate}%
              </p>
            )}
            {errors.interestRate && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.interestRate}
              </p>
            )}
          </div>

          {/* Approval Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Approval Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) delete errors.reason;
              }}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                errors.reason ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder="Enter reason for approval..."
            />
            {errors.reason && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.reason}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Approve Loan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


