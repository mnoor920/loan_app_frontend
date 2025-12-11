// Loan calculation utilities for computing payments, interest, and totals

import { LoanCalculation, LOAN_CONSTANTS } from '../types/loan';

/**
 * Calculate loan payment details including monthly payment and total amount
 * @param loanAmount - Principal loan amount
 * @param durationMonths - Loan duration in months
 * @param interestRate - Annual interest rate as percentage (e.g., 5.0 for 5%)
 * @returns Complete loan calculation details
 */
export function calculateLoanPayment(
  loanAmount: number,
  durationMonths: number,
  interestRate: number = LOAN_CONSTANTS.DEFAULT_INTEREST_RATE
): LoanCalculation {
  // Validate inputs
  if (loanAmount <= 0 || durationMonths <= 0 || interestRate < 0) {
    throw new Error('Invalid loan parameters');
  }

  // Calculate simple interest (as used in the original loan form)
  const totalInterest = (loanAmount * interestRate * durationMonths) / (12 * 100);
  const totalAmount = loanAmount + totalInterest;
  const monthlyPayment = totalAmount / durationMonths;

  return {
    loanAmount,
    durationMonths,
    interestRate,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100, // Round to 2 decimal places
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
  };
}

/**
 * Calculate compound interest loan payment (alternative calculation method)
 * @param loanAmount - Principal loan amount
 * @param durationMonths - Loan duration in months
 * @param interestRate - Annual interest rate as percentage
 * @returns Monthly payment using compound interest formula
 */
export function calculateCompoundInterestPayment(
  loanAmount: number,
  durationMonths: number,
  interestRate: number
): number {
  const monthlyRate = interestRate / 100 / 12;
  
  if (monthlyRate === 0) {
    return loanAmount / durationMonths;
  }

  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
    (Math.pow(1 + monthlyRate, durationMonths) - 1);

  return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Validate loan amount against system constraints
 * @param amount - Loan amount to validate
 * @returns Validation result with error message if invalid
 */
export function validateLoanAmount(amount: number): { isValid: boolean; error?: string } {
  if (amount < LOAN_CONSTANTS.MIN_LOAN_AMOUNT) {
    return {
      isValid: false,
      error: `Minimum loan amount is $${LOAN_CONSTANTS.MIN_LOAN_AMOUNT.toLocaleString()}`
    };
  }

  if (amount > LOAN_CONSTANTS.MAX_LOAN_AMOUNT) {
    return {
      isValid: false,
      error: `Maximum loan amount is $${LOAN_CONSTANTS.MAX_LOAN_AMOUNT.toLocaleString()}`
    };
  }

  return { isValid: true };
}

/**
 * Validate loan duration against available options
 * @param duration - Duration in months to validate
 * @returns Validation result with error message if invalid
 */
export function validateLoanDuration(duration: number): { isValid: boolean; error?: string } {
  if (!LOAN_CONSTANTS.AVAILABLE_DURATIONS.includes(duration as any)) {
    return {
      isValid: false,
      error: `Duration must be one of: ${LOAN_CONSTANTS.AVAILABLE_DURATIONS.join(', ')} months`
    };
  }

  return { isValid: true };
}

/**
 * Format currency amount for display
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate next payment due date based on loan start date
 * @param firstPaymentDate - Date of first payment
 * @param paymentsCompleted - Number of payments already made
 * @returns Next payment due date or null if loan is completed
 */
export function calculateNextPaymentDate(
  firstPaymentDate: string,
  paymentsCompleted: number,
  totalPayments: number
): string | null {
  if (paymentsCompleted >= totalPayments) {
    return null; // Loan is completed
  }

  const firstDate = new Date(firstPaymentDate);
  const nextPaymentDate = new Date(firstDate);
  nextPaymentDate.setMonth(firstDate.getMonth() + paymentsCompleted + 1);

  return nextPaymentDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

/**
 * Calculate loan statistics for dashboard
 * @param loans - Array of user loans
 * @returns Dashboard statistics
 */
export function calculateDashboardStats(loans: any[]): {
  totalBalance: number;
  totalLoanAmount: number;
  nextPaymentDue: string | null;
  activeLoansCount: number;
  pendingLoansCount: number;
  completedLoansCount: number;
} {
  let totalLoanAmount = 0;
  let activeLoansCount = 0;
  let pendingLoansCount = 0;
  let completedLoansCount = 0;
  let nextPaymentDue: string | null = null;
  let earliestPaymentDate: Date | null = null;

  loans.forEach(loan => {
    totalLoanAmount += loan.loanAmount;

    switch (loan.status) {
      case 'In Repayment':
      case 'Approved':
        activeLoansCount++;
        // Calculate next payment date for active loans
        if (loan.firstPaymentDate) {
          const nextPayment = calculateNextPaymentDate(loan.firstPaymentDate, 0, loan.durationMonths);
          if (nextPayment) {
            const paymentDate = new Date(nextPayment);
            if (!earliestPaymentDate || paymentDate < earliestPaymentDate) {
              earliestPaymentDate = paymentDate;
              nextPaymentDue = nextPayment;
            }
          }
        }
        break;
      case 'Pending Approval':
        pendingLoansCount++;
        break;
      case 'Completed':
        completedLoansCount++;
        break;
    }
  });

  return {
    totalBalance: 0, // This would come from a separate balance calculation
    totalLoanAmount,
    nextPaymentDue,
    activeLoansCount,
    pendingLoansCount,
    completedLoansCount,
  };
}