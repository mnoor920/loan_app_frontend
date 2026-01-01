'use client';
import { CreditCard, DollarSign, Calendar, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/loan-calculations';

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

interface LoanInfoCardProps {
  loanInfo: LoanInfo;
}

export default function LoanInfoCard({ loanInfo }: LoanInfoCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Approved Loan Details</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Loan Amount</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(loanInfo.loanAmount)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
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
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs font-medium">Interest Rate</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {loanInfo.interestRate}%
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
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
  );
}

