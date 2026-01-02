// Loan data models and interfaces for the loan management system

export type LoanStatus = 
  | 'Pending Approval' 
  | 'Approved' 
  | 'In Repayment' 
  | 'Completed' 
  | 'Rejected'
  | 'Review'
  | 'Pending'
  | 'Reject'
  | 'On hold';

// Main loan interface representing a loan record in the database
export interface Loan {
  id: string;
  userId: string;
  loanAmount: number;
  durationMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalAmount: number;
  status: LoanStatus;
  applicationDate: string;
  approvalDate?: string;
  firstPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for loan application requests from the frontend
export interface LoanApplicationRequest {
  loanAmount: number;
  durationMonths: number;
  agreedToTerms: boolean;
}

// Interface for loan application response
export interface LoanApplicationResponse {
  success: boolean;
  loanId?: string;
  message: string;
  loan?: Loan;
}

// Interface for dashboard statistics calculated from loan data
export interface DashboardStats {
  totalBalance: number;
  totalLoanAmount: number;
  nextPaymentDue: string | null;
  activeLoansCount: number;
  pendingLoansCount: number;
  completedLoansCount: number;
}

// Interface for loan list response
export interface UserLoansResponse {
  success: boolean;
  loans: Loan[];
  stats: DashboardStats;
  message?: string;
}

// Interface for loan details response
export interface LoanDetailsResponse {
  success: boolean;
  loan?: Loan;
  message?: string;
}

// Interface for loan calculation utilities
export interface LoanCalculation {
  loanAmount: number;
  durationMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
}

// Interface for loan database operations
export interface LoanCreateData {
  userId: string;
  loanAmount: number;
  durationMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalAmount: number;
  status?: LoanStatus;
}

// Interface for loan update operations
export interface LoanUpdateData {
  status?: LoanStatus;
  approvalDate?: string;
  firstPaymentDate?: string;
}

// Interface for loan query filters
export interface LoanQueryFilters {
  userId?: string;
  status?: LoanStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// Utility type for loan form validation
export interface LoanFormErrors {
  loanAmount?: string;
  durationMonths?: string;
  agreedToTerms?: string;
  general?: string;
}

// Interface for loan payment schedule (future enhancement)
export interface LoanPayment {
  id: string;
  loanId: string;
  paymentNumber: number;
  dueDate: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  paidDate?: string;
}

// Constants for loan validation
export const LOAN_CONSTANTS = {
  MIN_LOAN_AMOUNT: 1000,
  MAX_LOAN_AMOUNT: 500000,
  MIN_DURATION_MONTHS: 6,
  MAX_DURATION_MONTHS: 48,
  DEFAULT_INTEREST_RATE: 5.0,
  AVAILABLE_DURATIONS: [6, 12, 24, 36, 48] as const,
} as const;

// Type for available loan durations
export type LoanDuration = typeof LOAN_CONSTANTS.AVAILABLE_DURATIONS[number];

// Interface for fast dashboard API response (optimized for performance)
export interface FastDashboardResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  stats: DashboardStats;
  recentLoans: Array<{
    id: string;
    loanAmount: number;
    status: string;
    applicationDate: string;
    monthlyPayment: number;
  }>;
  activationStatus: {
    isActivated: boolean;
    progress: number;
  };
  message?: string;
}

// Interface for batch profile API response (optimized for performance)
export interface BatchProfileResponse {
  success: boolean;
  profile: any; // Will be defined based on activation profile structure
  activationSteps: any[];
  preferences: any;
  message?: string;
}