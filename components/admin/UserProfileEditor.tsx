'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  X, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  User,
  FileText,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  validateUserProfile, 
  validateName, 
  validateDateOfBirth, 
  validateNationality,
  validateRequired,
  validateIdNumber,
  validateBankAccount,
  validateAdminReason
} from '@/lib/validation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { adminApi, handleApiError } from '@/lib/api-client';

interface FamilyReference {
  id: string;
  fullName: string;
  relationship: string;
  contactInfo: string;
}

interface UserDocument {
  id: string;
  documentType: 'id_front' | 'id_back' | 'selfie' | 'passport_photo' | 'driver_license';
  filePath: string;
  originalFilename: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface UserActivationProfile {
  id: string;
  userId: string;
  // Step 1: Personal Information
  gender: 'male' | 'female';
  fullName: string;
  dateOfBirth: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  nationality: string;
  // Step 2: Family/Relatives
  familyRelatives: FamilyReference[];
  // Step 3: Address
  residingCountry: string;
  stateRegionProvince: string;
  townCity: string;
  // Step 4: ID Information
  idType: 'NIC' | 'passport' | 'driver_license';
  idNumber: string;
  // Step 5: Bank Information
  accountType: 'bank' | 'ewallet';
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  // Step 6: Signature
  signatureData?: string;
  signatureSubmittedAt?: string;
  signatureIpAddress?: string;
  // Status and metadata
  activationStatus: string;
  currentStep: number;
  completedAt?: string;
  documents: UserDocument[];
}

interface UserProfileEditorProps {
  userId: string;
}

export default function UserProfileEditor({ userId }: UserProfileEditorProps) {
  const router = useRouter();
  
  // Memoize the error handler options to prevent re-renders
  const errorHandlerOptions = useMemo(() => ({
    maxRetries: 3,
    onError: (error: any) => {
      // Custom error handling if needed
      console.error('Profile editor error:', error);
    }
  }), []);
  
  const { 
    handleError, 
    clearError, 
    executeWithErrorHandling, 
    getErrorMessage,
    hasError 
  } = useErrorHandler(errorHandlerOptions);
  
  // Data states
  const [profile, setProfile] = useState<UserActivationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<Partial<UserActivationProfile>>({});
  const [adminReason, setAdminReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Document upload states
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set());
  const [showReplaceDialog, setShowReplaceDialog] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  
  // Validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      const result = await executeWithErrorHandling(
        () => adminApi.getUserProfile(userId),
        'UserProfileEditor.fetchProfile'
      );
      
      if (result?.success) {
        setProfile(result.profile);
        setFormData(result.profile);
      }
      
      setLoading(false);
    };

    fetchProfile();
  }, [userId]); // Removed executeWithErrorHandling from dependencies

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
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

  // Handle family reference changes
  const handleFamilyReferenceChange = (index: number, field: string, value: string) => {
    const updatedReferences = [...(formData.familyRelatives || [])];
    updatedReferences[index] = {
      ...updatedReferences[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      familyRelatives: updatedReferences
    }));
  };

  // Handle document removal
  const handleDocumentRemove = async (documentId: string) => {
    const result = await executeWithErrorHandling(
      () => adminApi.deleteUserDocument(userId, documentId),
      'UserProfileEditor.removeDocument'
    );
    
    if (result?.success) {
      // Remove document from local state
      setFormData(prev => ({
        ...prev,
        documents: prev.documents?.filter(doc => doc.id !== documentId) || []
      }));
      setProfile(prev => prev ? {
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== documentId)
      } : null);
      setShowRemoveDialog(null);
    }
  };

  // Handle document replacement
  const handleDocumentReplace = async (documentId: string, file: File) => {
    setUploadingDocuments(prev => new Set(prev).add(documentId));
    clearError();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);
    
    const result = await executeWithErrorHandling(
      () => adminApi.replaceUserDocument(userId, documentId, formData),
      'UserProfileEditor.replaceDocument'
    );
    
    if (result?.success) {
      // Update document in local state
      setFormData(prev => ({
        ...prev,
        documents: prev.documents?.map(doc => 
          doc.id === documentId ? result.document : doc
        ) || []
      }));
      setProfile(prev => prev ? {
        ...prev,
        documents: prev.documents.map(doc => 
          doc.id === documentId ? result.document : doc
        )
      } : null);
      setShowReplaceDialog(null);
    }
    
    setUploadingDocuments(prev => {
      const newSet = new Set(prev);
      newSet.delete(documentId);
      return newSet;
    });
  };

  // Handle view document securely
  const handleViewDocument = async (documentId: string, mimeType: string, filename: string) => {
    try {
      const blob = await executeWithErrorHandling(
        () => adminApi.getDocumentContent(documentId),
        'UserProfileEditor.viewDocument'
      );
      
      if (blob) {
        // Create object URL
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        // Suggest filename if possible (though target=_blank usually displays)
        // If it sends headers correctly, browser might handle display.
        // For viewing, opening a new tab with Object URL is best.
        window.open(url, '_blank');
        
        // Cleanup after a delay (to ensure it opens)
        setTimeout(() => window.URL.revokeObjectURL(url), 1000 * 60); // 1 minute
      }
    } catch (error) {
       console.error("Failed to view document", error);
    }
  };

  // Handle file input change for document replacement
  const handleFileInputChange = (documentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        handleError(new Error('Please upload a valid image (JPEG, PNG) or PDF file'));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        handleError(new Error('File size must be less than 5MB'));
        return;
      }
      
      handleDocumentReplace(documentId, file);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const generalErrors: string[] = [];
    
    // Validate admin reason
    const reasonValidation = validateAdminReason(adminReason);
    if (!reasonValidation.isValid) {
      generalErrors.push(reasonValidation.error!);
    }
    
    // Validate profile data
    const profileValidation = validateUserProfile(formData);
    if (!profileValidation.isValid) {
      generalErrors.push(...profileValidation.errors);
    }
    
    // Individual field validations
    if (formData.fullName) {
      const nameValidation = validateName(formData.fullName, 'Full name');
      if (!nameValidation.isValid) {
        errors.fullName = nameValidation.error!;
      }
    }
    
    if (formData.dateOfBirth) {
      const dobValidation = validateDateOfBirth(formData.dateOfBirth);
      if (!dobValidation.isValid) {
        errors.dateOfBirth = dobValidation.error!;
      }
    }
    
    if (formData.nationality) {
      const nationalityValidation = validateNationality(formData.nationality);
      if (!nationalityValidation.isValid) {
        errors.nationality = nationalityValidation.error!;
      }
    }
    
    if (formData.idNumber && formData.idType) {
      const idValidation = validateIdNumber(formData.idNumber, formData.idType);
      if (!idValidation.isValid) {
        errors.idNumber = idValidation.error!;
      }
    }
    
    if (formData.accountNumber) {
      const accountValidation = validateBankAccount(formData.accountNumber);
      if (!accountValidation.isValid) {
        errors.accountNumber = accountValidation.error!;
      }
    }
    
    if (formData.accountHolderName) {
      const holderValidation = validateName(formData.accountHolderName, 'Account holder name');
      if (!holderValidation.isValid) {
        errors.accountHolderName = holderValidation.error!;
      }
    }
    
    setFieldErrors(errors);
    setValidationErrors(generalErrors);
    
    return Object.keys(errors).length === 0 && generalErrors.length === 0;
  };

  // Handle save
  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm()) {
      handleError(new Error('Please fix the validation errors before saving'));
      return;
    }

    setSaving(true);
    clearError();
    
    const result = await executeWithErrorHandling(
      () => adminApi.updateUserProfile(userId, formData, 'admin', adminReason),
      'UserProfileEditor.saveProfile'
    );
    
    if (result?.success) {
      setProfile(result.profile);
      setFormData(result.profile);
      setSaveSuccess(true);
      setShowConfirmDialog(false);
      setAdminReason('');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    
    setSaving(false);
  };

  // Helper functions
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'id_front': 'ID Front Side',
      'id_back': 'ID Back Side',
      'selfie': 'Selfie',
      'passport_photo': 'Passport Photo',
      'driver_license': 'Driver License'
    };
    return labels[type] || type;
  };

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
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hasError && !profile) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Error Loading Profile</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{getErrorMessage()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">User Profile Not Found</p>
        <p className="text-sm">The requested user profile could not be found.</p>
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
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Profile Updated Successfully</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">User has been notified of the changes.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">{getErrorMessage()}</p>
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

      {/* Header with Action Buttons */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${getAvatarColor(formData.fullName || 'User')} rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0`}>
              {getInitials(formData.fullName || 'User')}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formData.fullName || 'User Profile'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User ID: {userId}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status: {profile.activationStatus} • Step {profile.currentStep}/6
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 lg:flex-shrink-0">
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => setShowConfirmDialog(true)}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Personal Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Step 1: Personal Information
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName || ''}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.fullName 
                  ? 'border-red-300 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            />
            <FieldError error={fieldErrors.fullName} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.dateOfBirth 
                  ? 'border-red-300 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            />
            <FieldError error={fieldErrors.dateOfBirth} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Marital Status
            </label>
            <select
              value={formData.maritalStatus || ''}
              onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nationality
            </label>
            <input
              type="text"
              value={formData.nationality || ''}
              onChange={(e) => handleFieldChange('nationality', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.nationality 
                  ? 'border-red-300 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            />
            <FieldError error={fieldErrors.nationality} />
          </div>
        </div>
      </div>

      {/* Step 2: Family References */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Step 2: Family References
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {formData.familyRelatives?.map((reference, index) => (
            <div key={reference.id || index}>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Reference {index + 1}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={reference.fullName || ''}
                      onChange={(e) => handleFamilyReferenceChange(index, 'fullName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={reference.relationship || ''}
                      onChange={(e) => handleFamilyReferenceChange(index, 'relationship', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Info
                  </label>
                  <input
                    type="text"
                    value={reference.contactInfo || ''}
                    onChange={(e) => handleFamilyReferenceChange(index, 'contactInfo', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3: Address */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Step 3: Residential Address
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Residing Country
            </label>
            <input
              type="text"
              value={formData.residingCountry || ''}
              onChange={(e) => handleFieldChange('residingCountry', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State / Region / Province
              </label>
              <input
                type="text"
                value={formData.stateRegionProvince || ''}
                onChange={(e) => handleFieldChange('stateRegionProvince', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Town / City
              </label>
              <input
                type="text"
                value={formData.townCity || ''}
                onChange={(e) => handleFieldChange('townCity', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: ID Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Step 4: ID Information
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID Type
              </label>
              <select
                value={formData.idType || ''}
                onChange={(e) => handleFieldChange('idType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select ID Type</option>
                <option value="NIC">National ID Card</option>
                <option value="passport">Passport</option>
                <option value="driver_license">Driver License</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID Number
              </label>
              <input
                type="text"
                value={formData.idNumber || ''}
                onChange={(e) => handleFieldChange('idNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Documents */}
          {formData.documents && formData.documents.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Uploaded Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.documents.map((document) => (
                  <div key={document.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getDocumentTypeLabel(document.documentType)}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        document.verificationStatus === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : document.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {document.verificationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      {document.originalFilename}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleViewDocument(document.id, 'application/pdf', document.originalFilename)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>

                      <button
                        onClick={() => setShowReplaceDialog(document.id)}
                        disabled={uploadingDocuments.has(document.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {uploadingDocuments.has(document.id) ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        {uploadingDocuments.has(document.id) ? 'Uploading...' : 'Replace'}
                      </button>
                      <button
                        onClick={() => setShowRemoveDialog(document.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 5: Bank Information */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Step 5: Bank Information
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Type
            </label>
            <select
              value={formData.accountType || ''}
              onChange={(e) => handleFieldChange('accountType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Account Type</option>
              <option value="bank">Bank Account</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bank Name / E-Wallet Provider
            </label>
            <input
              type="text"
              value={formData.bankName || ''}
              onChange={(e) => handleFieldChange('bankName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber || ''}
              onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              value={formData.accountHolderName || ''}
              onChange={(e) => handleFieldChange('accountHolderName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Step 6: Digital Signature */}
      {profile.signatureData && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Step 6: Digital Signature
          </h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border border-slate-200 rounded-xl bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="bg-white border-2 border-slate-200 rounded-lg p-3 flex items-center justify-center">
                <img 
                  src={profile.signatureData} 
                  alt="User Signature" 
                  className="max-h-20 max-w-[200px] object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-900 font-medium mb-1">
                  Signature submitted on: {profile.signatureSubmittedAt ? formatDate(profile.signatureSubmittedAt) : 'Unknown'}
                </div>
                <div className="text-xs text-slate-600">
                  IP Address: {profile.signatureIpAddress || 'Unknown'}
                </div>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Invalidate Signature
            </button>
          </div>
        </div>
      )}

      {/* Document Remove Dialog */}
      {showRemoveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Remove Document
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to remove this document? This action cannot be undone.
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700 dark:text-red-300">
                  <p className="font-medium">Warning:</p>
                  <p>This will permanently delete the document from the system. The user will be notified of this change.</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveDialog(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDocumentRemove(showRemoveDialog)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Remove Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Replace Dialog */}
      {showReplaceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Replace Document
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a new file to replace the existing document. The old document will be permanently removed.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choose new file
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  JPEG, PNG, or PDF (max 5MB)
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => handleFileInputChange(showReplaceDialog, e)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium">Important:</p>
                  <p>Replacing this document will permanently delete the current file and cannot be undone. The user will be notified of this change.</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowReplaceDialog(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Profile Changes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You are about to update this user's profile. The user will be automatically notified of these changes.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for changes (required)
              </label>
              <textarea
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="Please provide a reason for these profile changes..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setAdminReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!adminReason.trim() || saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}