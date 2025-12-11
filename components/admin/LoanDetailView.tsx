'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Phone, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  User,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Eye,
  Edit3,
  XCircle
} from 'lucide-react';
import { 
  validateLoanForm, 
  validateLoanAmount, 
  validateInterestRate, 
  validateLoanDuration,
  validateAdminReason
} from '@/lib/validation';

interface UserActivationProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  residingCountry: string;
  stateRegionProvince: string;
  townCity: string;
  activationStatus: string;
  currentStep: number;
  completedAt?: string;
}

interface LoanApplicationWithUser {
  id: string;
  userId: string;
  loanAmount: number;
  durationMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalAmount: number;
  status: 'Pending Approval' | 'Approved' | 'In Repayment' | 'Completed' | 'Rejected';
  loanPurpose: string;
  applicationDate: string;
  approvalDate?: string;
  firstPaymentDate?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  profile?: UserActivationProfile;
  adminModifications?: Array<{
    id: string;
    modifiedBy: string;
    modificationType: string;
    oldValue: any;
    newValue: any;
    reason?: string;
    modifiedAt: string;
  }>;
}

interface LoanDetailViewProps {
  loanId: string;
}

type TabType = 'details' | 'applicant' | 'documents' | 'history';

export default function LoanDetailView({ loanId }: LoanDetailViewProps) {
  const router = useRouter();
  
  // Data states
  const [loan, setLoan] = useState<LoanApplicationWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'save' | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    loanAmount: '',
    durationMonths: '',
    interestRate: '',
    status: '',
    adminNotes: ''
  });
  const [adminReason, setAdminReason] = useState('');
  
  // Validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch loan details with retry mechanism
  const fetchLoan = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/loans/${loanId}/details`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLoan(data.loan);
        setFormData({
          loanAmount: data.loan.loanAmount.toString(),
          durationMonths: data.loan.durationMonths.toString(),
          interestRate: data.loan.interestRate.toString(),
          status: data.loan.status,
          adminNotes: data.loan.adminNotes || ''
        });
      } else {
        // Handle specific error cases
        if (data.message?.includes('table missing') || data.message?.includes('schema')) {
          setError(`Database setup required: ${data.message}`);
        } else if (response.status === 404) {
          setError('Loan application not found. It may have been deleted.');
        } else if (response.status === 401 || response.status === 403) {
          setError('You do not have permission to view this loan application.');
        } else {
          setError(data.message || 'Failed to load loan details');
        }
      }
    } catch (error: any) {
      console.error('Error fetching loan:', error);
      
      // Handle network errors with retry logic
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (retryCount < 2) {
          console.log(`Retrying fetch loan details, attempt ${retryCount + 1}`);
          setTimeout(() => fetchLoan(retryCount + 1), 1000 * (retryCount + 1));
          return;
        } else {
          setError('Network error. Please check your connection and try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loanId) {
      fetchLoan();
    }
  }, [loanId]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear validation errors
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Handle loan status actions
  const handleStatusAction = (action: 'approve' | 'reject') => {
    setConfirmAction(action);
    setFormData(prev => ({
      ...prev,
      status: action === 'approve' ? 'Approved' : 'Rejected'
    }));
    setShowConfirmDialog(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const generalErrors: string[] = [];
    
    // Validate admin reason (only required for status changes)
    if (confirmAction === 'approve' || confirmAction === 'reject' || confirmAction === 'save') {
      if (!adminReason.trim()) {
        generalErrors.push('Admin reason is required for this action');
      } else if (adminReason.trim().length < 10) {
        generalErrors.push('Admin reason must be at least 10 characters long');
      }
    }
    
    // Validate loan data only if editing
    if (isEditing || confirmAction === 'save') {
      // Individual field validations
      if (formData.loanAmount) {
        const amount = parseFloat(formData.loanAmount);
        if (isNaN(amount) || amount <= 0) {
          errors.loanAmount = 'Loan amount must be a positive number';
        } else if (amount > 1000000) {
          errors.loanAmount = 'Loan amount cannot exceed $1,000,000';
        }
      }
      
      if (formData.interestRate) {
        const rate = parseFloat(formData.interestRate);
        if (isNaN(rate) || rate < 0) {
          errors.interestRate = 'Interest rate must be a non-negative number';
        } else if (rate > 50) {
          errors.interestRate = 'Interest rate cannot exceed 50%';
        }
      }
      
      if (formData.durationMonths) {
        const duration = parseInt(formData.durationMonths);
        if (isNaN(duration) || duration <= 0) {
          errors.durationMonths = 'Duration must be a positive number';
        } else if (duration > 360) {
          errors.durationMonths = 'Duration cannot exceed 360 months (30 years)';
        }
      }
    }
    
    setFieldErrors(errors);
    setValidationErrors(generalErrors);
    
    return Object.keys(errors).length === 0 && generalErrors.length === 0;
  };

  // Handle save with enhanced error handling and retry
  const handleSave = async (retryCount = 0) => {
    // Validate form before saving
    if (!validateForm()) {
      setError('Please fix the validation errors before saving');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/admin/loans/${loanId}/details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          loanAmount: parseFloat(formData.loanAmount),
          durationMonths: parseInt(formData.durationMonths),
          interestRate: parseFloat(formData.interestRate),
          status: formData.status,
          adminNotes: formData.adminNotes,
          reason: adminReason
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLoan(data.loan);
        setFormData({
          loanAmount: data.loan.loanAmount.toString(),
          durationMonths: data.loan.durationMonths.toString(),
          interestRate: data.loan.interestRate.toString(),
          status: data.loan.status,
          adminNotes: data.loan.adminNotes || ''
        });
        setSaveSuccess(true);
        setShowConfirmDialog(false);
        setConfirmAction(null);
        setAdminReason('');
        setIsEditing(false);
        
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        // Handle specific error cases
        if (data.message?.includes('table missing') || data.message?.includes('schema')) {
          setError(`Database setup required: ${data.message}`);
        } else if (response.status === 404) {
          setError('Loan application not found. It may have been deleted.');
        } else if (response.status === 401 || response.status === 403) {
          setError('You do not have permission to modify this loan application.');
        } else if (response.status >= 500) {
          setError('Server error occurred. Please try again in a moment.');
        } else {
          setError(data.message || 'Failed to save loan changes');
        }
      }
    } catch (error: any) {
      console.error('Error saving loan:', error);
      
      // Handle network errors with retry logic
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (retryCount < 2) {
          console.log(`Retrying save loan, attempt ${retryCount + 1}`);
          setTimeout(() => handleSave(retryCount + 1), 1000 * (retryCount + 1));
          return;
        } else {
          setError('Network error. Please check your connection and try again.');
        }
      } else {
        setError('An unexpected error occurred while saving. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Helper functions
  const getInitials = (firstName: string, lastName: string): string => {
    return (firstName[0] + lastName[0]).toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 inline-flex text-sm font-semibold rounded-full";
    switch (status) {
      case 'Approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'In Repayment':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'Completed':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
      case 'Pending Approval':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'Rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
    }
  };

  const tabs = [
    { id: 'details' as TabType, label: 'Application Details' },
    { id: 'applicant' as TabType, label: 'Applicant Information' },
    { id: 'documents' as TabType, label: 'Documents' },
    { id: 'history' as TabType, label: 'Modification History' },
  ];

  // Helper component for field errors
  const FieldError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Error Loading Loan</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => fetchLoan()}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => router.back()}
                className="px-3 py-1 border border-red-300 text-red-700 dark:text-red-300 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Loan Application Not Found</p>
        <p className="text-sm">The requested loan application could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Loan Updated Successfully</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">Applicant has been notified of the changes.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Validation Errors</p>
              <ul className="text-xs text-red-700 dark:text-red-400 mt-1 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Loan Application #{loan.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and manage the details of this loan application.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 lg:flex-shrink-0">
          {!isEditing ? (
            <>
              {loan.status === 'Pending Approval' && (
                <>
                  <button 
                    onClick={() => handleStatusAction('reject')}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Loan
                  </button>
                  <button 
                    onClick={() => handleStatusAction('approve')}
                    className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Loan
                  </button>
                </>
              )}
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Details
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data
                  setFormData({
                    loanAmount: loan.loanAmount.toString(),
                    durationMonths: loan.durationMonths.toString(),
                    interestRate: loan.interestRate.toString(),
                    status: loan.status,
                    adminNotes: loan.adminNotes || ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setConfirmAction('save');
                  setShowConfirmDialog(true);
                }}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Summary & Applicant */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Summary</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                <span className={getStatusBadge(loan.status)}>
                  {loan.status}
                </span>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Loan Purpose</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{loan.loanPurpose || 'Not specified'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requested Amount</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(loan.loanAmount)}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{loan.durationMonths} months</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Rate</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{loan.interestRate}%</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Submission Date</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(loan.applicationDate)}</div>
              </div>

              {loan.approvalDate && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approval Date</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(loan.approvalDate)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Applicant Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Applicant</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${getAvatarColor(`${loan.applicant.firstName} ${loan.applicant.lastName}`)} rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0`}>
                {getInitials(loan.applicant.firstName, loan.applicant.lastName)}
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {loan.applicant.firstName} {loan.applicant.lastName}
                </div>
                <button 
                  onClick={() => router.push(`/adminusers/${loan.applicant.id}`)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="break-all">{loan.applicant.email}</span>
              </div>
              {loan.applicant.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{loan.applicant.phone}</span>
                </div>
              )}
            </div>

            {/* Profile Summary */}
            {loan.profile && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Profile Status</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {loan.profile.activationStatus === 'completed' ? 'Activated' : 'Pending Activation'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Step {loan.profile.currentStep}/6 completed
                </div>
                {loan.profile.completedAt && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Completed: {formatDate(loan.profile.completedAt)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Tabs Content */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loan Amount
                    </label>
                    {isEditing ? (
                      <div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-500 dark:text-gray-400">$</span>
                          <input
                            type="number"
                            value={formData.loanAmount}
                            onChange={(e) => handleFieldChange('loanAmount', e.target.value)}
                            className={`w-full pl-8 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              fieldErrors.loanAmount 
                                ? 'border-red-300 dark:border-red-700' 
                                : 'border-gray-300 dark:border-gray-700'
                            }`}
                          />
                        </div>
                        <FieldError error={fieldErrors.loanAmount} />
                      </div>
                    ) : (
                      <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {formatCurrency(loan.loanAmount)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loan Status
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.status}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="In Repayment">In Repayment</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    ) : (
                      <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <span className={getStatusBadge(loan.status)}>
                          {loan.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interest Rate
                    </label>
                    {isEditing ? (
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={formData.interestRate}
                            onChange={(e) => handleFieldChange('interestRate', e.target.value)}
                            className={`w-full pr-8 pl-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              fieldErrors.interestRate 
                                ? 'border-red-300 dark:border-red-700' 
                                : 'border-gray-300 dark:border-gray-700'
                            }`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base text-gray-500 dark:text-gray-400">%</span>
                        </div>
                        <FieldError error={fieldErrors.interestRate} />
                      </div>
                    ) : (
                      <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {loan.interestRate}%
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loan Duration (Months)
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          value={formData.durationMonths}
                          onChange={(e) => handleFieldChange('durationMonths', e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            fieldErrors.durationMonths 
                              ? 'border-red-300 dark:border-red-700' 
                              : 'border-gray-300 dark:border-gray-700'
                          }`}
                        />
                        <FieldError error={fieldErrors.durationMonths} />
                      </div>
                    ) : (
                      <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {loan.durationMonths} months
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loan Purpose
                  </label>
                  <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {loan.loanPurpose || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Internal Admin Notes
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.adminNotes}
                      onChange={(e) => handleFieldChange('adminNotes', e.target.value)}
                      placeholder="Add internal notes about this loan application..."
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  ) : (
                    <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[120px]">
                      {loan.adminNotes || 'No notes added yet.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'applicant' && (
              <div className="space-y-6">
                {loan.profile ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {loan.profile.fullName}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date of Birth
                        </label>
                        <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {formatDate(loan.profile.dateOfBirth)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nationality
                        </label>
                        <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {loan.profile.nationality}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Residing Country
                        </label>
                        <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {loan.profile.residingCountry}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Address
                      </label>
                      <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {loan.profile.townCity}, {loan.profile.stateRegionProvince}, {loan.profile.residingCountry}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => router.push(`/adminusers/${loan.applicant.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Profile
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Applicant profile information not available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Document management coming soon</p>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {loan.adminModifications && loan.adminModifications.length > 0 ? (
                  loan.adminModifications.map((modification) => (
                    <div key={modification.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {modification.modificationType.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            by {modification.modifiedBy} • {formatDateTime(modification.modifiedAt)}
                          </div>
                        </div>
                      </div>
                      {modification.reason && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Reason:</strong> {modification.reason}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <strong>Before:</strong> {JSON.stringify(modification.oldValue)}
                          </div>
                          <div>
                            <strong>After:</strong> {JSON.stringify(modification.newValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No modification history available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {confirmAction === 'approve' ? 'Approve Loan Application' :
               confirmAction === 'reject' ? 'Reject Loan Application' :
               'Confirm Loan Changes'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {confirmAction === 'approve' ? 'You are about to approve this loan application. The applicant will be notified immediately.' :
               confirmAction === 'reject' ? 'You are about to reject this loan application. The applicant will be notified immediately.' :
               'You are about to update this loan application. The applicant will be notified of these changes.'}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for {confirmAction === 'approve' ? 'approval' : confirmAction === 'reject' ? 'rejection' : 'changes'} (required)
              </label>
              <textarea
                value={adminReason}
                onChange={(e) => {
                  setAdminReason(e.target.value);
                  // Clear validation errors when user starts typing
                  if (validationErrors.length > 0) {
                    setValidationErrors([]);
                  }
                }}
                placeholder={`Please provide a detailed reason for ${confirmAction === 'approve' ? 'approving' : confirmAction === 'reject' ? 'rejecting' : 'updating'} this loan application (minimum 10 characters)...`}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  adminReason.trim().length > 0 && adminReason.trim().length < 10
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
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
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                  setAdminReason('');
                  setFieldErrors({});
                  setValidationErrors([]);
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave()}
                disabled={!adminReason.trim() || adminReason.trim().length < 10 || saving}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : confirmAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  confirmAction === 'approve' ? 'Approve Loan' :
                  confirmAction === 'reject' ? 'Reject Loan' :
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}