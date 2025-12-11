import { supabase } from './supabase';
import {
  validateName,
  validateDateOfBirth,
  validateRequired,
  validateIdNumber,
  validateBankAccount,
  validateNationality,
  validateAddress,
  type ValidationResult,
  type FieldValidationResult
} from './validation';
import { DatabaseErrorHandler, FileUploadErrorHandler } from './database-error-handler';
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step6Data
} from '../contexts/ActivationContext';

export interface UserActivationProfile {
  id: string;
  user_id: string;

  // Step 1 data
  gender?: string;
  full_name?: string;
  date_of_birth?: string;
  marital_status?: string;
  nationality?: string;
  agreed_to_terms?: boolean;

  // Step 2 data
  family_relatives?: any[];

  // Step 3 data
  residing_country?: string;
  state_region_province?: string;
  town_city?: string;

  // Step 4 data
  id_type?: string;
  id_number?: string;

  // Step 5 data
  account_type?: string;
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;

  // Step 6 data
  signature_data?: string;

  // Status
  activation_status: string;
  current_step: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserDocument {
  id: string;
  user_id: string;
  activation_profile_id?: string;
  document_type: string;
  original_filename?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  verification_status: string;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced validation interfaces
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface StepValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  sanitizedData: any;
}

// Audit logging interfaces
export interface AuditAction {
  actionType: 'create' | 'update' | 'delete' | 'document_upload' | 'status_change';
  stepNumber?: number;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  activationProfileId?: string;
  action: AuditAction;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export type ActivationStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface CompleteActivationData {
  profile: UserActivationProfile | null;
  documents: UserDocument[];
  progress: number;
  isComplete: boolean;
  validationStatus: 'valid' | 'invalid' | 'pending';
}

export class ActivationService {

  // Enhanced validation methods
  static validateStepData(step: number, data: any): StepValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let sanitizedData = { ...data };

    try {
      switch (step) {
        case 1:
          return this.validateStep1Data(data);
        case 2:
          return this.validateStep2Data(data);
        case 3:
          return this.validateStep3Data(data);
        case 4:
          return this.validateStep4Data(data);
        case 5:
          return this.validateStep5Data(data);
        case 6:
          return this.validateStep6Data(data);
        default:
          errors.push({
            field: 'step',
            code: 'INVALID_STEP',
            message: 'Invalid step number',
            severity: 'error'
          });
      }
    } catch (error) {
      errors.push({
        field: 'general',
        code: 'VALIDATION_ERROR',
        message: 'Validation failed due to unexpected error',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  private static validateStep1Data(data: Step1Data): StepValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sanitizedData = { ...data };

    // Validate full name
    const nameValidation = validateName(data.fullName, 'Full name');
    if (!nameValidation.isValid) {
      errors.push({
        field: 'fullName',
        code: 'INVALID_NAME',
        message: nameValidation.error!,
        severity: 'error'
      });
    } else {
      sanitizedData.fullName = data.fullName.trim();
    }

    // Validate date of birth
    if (data.dateOfBirth) {
      const dateString = `${data.dateOfBirth.year}-${data.dateOfBirth.month.padStart(2, '0')}-${data.dateOfBirth.day.padStart(2, '0')}`;
      const dobValidation = validateDateOfBirth(dateString);
      if (!dobValidation.isValid) {
        errors.push({
          field: 'dateOfBirth',
          code: 'INVALID_DOB',
          message: dobValidation.error!,
          severity: 'error'
        });
      }
    } else {
      errors.push({
        field: 'dateOfBirth',
        code: 'REQUIRED',
        message: 'Date of birth is required',
        severity: 'error'
      });
    }

    // Validate gender
    if (!data.gender || !['male', 'female'].includes(data.gender)) {
      errors.push({
        field: 'gender',
        code: 'INVALID_GENDER',
        message: 'Please select a valid gender',
        severity: 'error'
      });
    }

    // Validate nationality
    if (data.nationality) {
      const nationalityValidation = validateNationality(data.nationality);
      if (!nationalityValidation.isValid) {
        errors.push({
          field: 'nationality',
          code: 'INVALID_NATIONALITY',
          message: nationalityValidation.error!,
          severity: 'error'
        });
      } else {
        sanitizedData.nationality = data.nationality.trim();
      }
    }

    // Validate terms agreement
    if (!data.agreedToTerms) {
      errors.push({
        field: 'agreedToTerms',
        code: 'TERMS_NOT_AGREED',
        message: 'You must agree to the terms and conditions',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  private static validateStep2Data(data: Step2Data): StepValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sanitizedData = { ...data };

    if (!data.familyRelatives || !Array.isArray(data.familyRelatives)) {
      errors.push({
        field: 'familyRelatives',
        code: 'REQUIRED',
        message: 'At least one family relative is required',
        severity: 'error'
      });
    } else {
      if (data.familyRelatives.length === 0) {
        errors.push({
          field: 'familyRelatives',
          code: 'REQUIRED',
          message: 'At least one family relative is required',
          severity: 'error'
        });
      } else {
        // Validate each family relative
        sanitizedData.familyRelatives = data.familyRelatives.map((relative, index) => {
          const nameValidation = validateName(relative.fullName, 'Relative name');
          if (!nameValidation.isValid) {
            errors.push({
              field: `familyRelatives[${index}].fullName`,
              code: 'INVALID_NAME',
              message: `Relative ${index + 1}: ${nameValidation.error}`,
              severity: 'error'
            });
          }

          if (!relative.relationship || relative.relationship.trim().length < 2) {
            errors.push({
              field: `familyRelatives[${index}].relationship`,
              code: 'INVALID_RELATIONSHIP',
              message: `Relative ${index + 1}: Relationship is required`,
              severity: 'error'
            });
          }

          if (!relative.phoneNumber || relative.phoneNumber.trim().length < 10) {
            errors.push({
              field: `familyRelatives[${index}].phoneNumber`,
              code: 'INVALID_PHONE',
              message: `Relative ${index + 1}: Valid phone number is required`,
              severity: 'error'
            });
          }

          return {
            ...relative,
            fullName: relative.fullName?.trim() || '',
            relationship: relative.relationship?.trim() || '',
            phoneNumber: relative.phoneNumber?.trim() || ''
          };
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  private static validateStep3Data(data: Step3Data): StepValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sanitizedData = { ...data };

    // Validate residing country
    const countryValidation = validateRequired(data.residingCountry, 'Residing country');
    if (!countryValidation.isValid) {
      errors.push({
        field: 'residingCountry',
        code: 'REQUIRED',
        message: countryValidation.error!,
        severity: 'error'
      });
    } else {
      sanitizedData.residingCountry = data.residingCountry.trim();
    }

    // Validate state/region/province
    const stateValidation = validateRequired(data.stateRegionProvince, 'State/Region/Province');
    if (!stateValidation.isValid) {
      errors.push({
        field: 'stateRegionProvince',
        code: 'REQUIRED',
        message: stateValidation.error!,
        severity: 'error'
      });
    } else {
      sanitizedData.stateRegionProvince = data.stateRegionProvince.trim();
    }

    // Validate town/city
    const cityValidation = validateRequired(data.townCity, 'Town/City');
    if (!cityValidation.isValid) {
      errors.push({
        field: 'townCity',
        code: 'REQUIRED',
        message: cityValidation.error!,
        severity: 'error'
      });
    } else {
      sanitizedData.townCity = data.townCity.trim();
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  private static validateStep4Data(data: Step4Data): StepValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sanitizedData = { ...data };

    // Validate ID type
    if (!data.idType || data.idType !== 'NIC') {
      errors.push({
        field: 'idType',
        code: 'INVALID_ID_TYPE',
        message: 'Please select a valid ID type',
        severity: 'error'
      });
    }

    // Validate ID number
    if (data.idNumber) {
      const idValidation = validateIdNumber(data.idNumber, data.idType);
      if (!idValidation.isValid) {
        errors.push({
          field: 'idNumber',
          code: 'INVALID_ID_NUMBER',
          message: idValidation.error!,
          severity: 'error'
        });
      } else {
        sanitizedData.idNumber = data.idNumber.trim();
      }
    } else {
      errors.push({
        field: 'idNumber',
        code: 'REQUIRED',
        message: 'ID number is required',
        severity: 'error'
      });
    }

    // Validate required documents based on ID type
    if (data.idType === 'NIC') {
      if (!data.frontImage) {
        warnings.push({
          field: 'frontImage',
          code: 'DOCUMENT_MISSING',
          message: 'Front image of ID is recommended',
          severity: 'warning'
        });
      }
      if (!data.backImage) {
        warnings.push({
          field: 'backImage',
          code: 'DOCUMENT_MISSING',
          message: 'Back image of ID is recommended',
          severity: 'warning'
        });
      }
    }

    if (!data.selfieImage) {
      warnings.push({
        field: 'selfieImage',
        code: 'DOCUMENT_MISSING',
        message: 'Selfie image is recommended for verification',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  private static validateStep5Data(data: Step5Data): StepValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sanitizedData = { ...data };

    // Validate account type
    if (!data.accountType || !['bank', 'ewallet'].includes(data.accountType)) {
      errors.push({
        field: 'accountType',
        code: 'INVALID_ACCOUNT_TYPE',
        message: 'Please select a valid account type',
        severity: 'error'
      });
    }

    // Validate bank name
    const bankValidation = validateRequired(data.bankName, 'Bank name');
    if (!bankValidation.isValid) {
      errors.push({
        field: 'bankName',
        code: 'REQUIRED',
        message: bankValidation.error!,
        severity: 'error'
      });
    } else {
      sanitizedData.bankName = data.bankName.trim();
    }

    // Validate account number
    if (data.accountNumber) {
      const accountValidation = validateBankAccount(data.accountNumber);
      if (!accountValidation.isValid) {
        errors.push({
          field: 'accountNumber',
          code: 'INVALID_ACCOUNT_NUMBER',
          message: accountValidation.error!,
          severity: 'error'
        });
      } else {
        sanitizedData.accountNumber = data.accountNumber.trim();
      }
    } else {
      errors.push({
        field: 'accountNumber',
        code: 'REQUIRED',
        message: 'Account number is required',
        severity: 'error'
      });
    }

    // Validate account holder name
    const holderValidation = validateName(data.accountHolderName, 'Account holder name');
    if (!holderValidation.isValid) {
      errors.push({
        field: 'accountHolderName',
        code: 'INVALID_HOLDER_NAME',
        message: holderValidation.error!,
        severity: 'error'
      });
    } else {
      sanitizedData.accountHolderName = data.accountHolderName.trim();
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  private static validateStep6Data(data: Step6Data): StepValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sanitizedData = { ...data };

    // Validate signature
    if (!data.signature || data.signature.trim().length === 0) {
      errors.push({
        field: 'signature',
        code: 'REQUIRED',
        message: 'Digital signature is required',
        severity: 'error'
      });
    } else {
      // Basic signature validation (check if it's a valid data URL)
      if (!data.signature.startsWith('data:image/')) {
        errors.push({
          field: 'signature',
          code: 'INVALID_SIGNATURE',
          message: 'Invalid signature format',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  // Enhanced save methods with validation
  static async saveStepDataWithValidation(userId: string, step: number, data: any): Promise<UserActivationProfile> {
    // Validate data first
    const validation = this.validateStepData(step, data);

    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    // Log the action
    await this.logActivationAction(userId, {
      actionType: 'update',
      stepNumber: step,
      newValue: validation.sanitizedData,
      metadata: {
        validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined
      }
    });

    // Use sanitized data for saving
    switch (step) {
      case 1:
        return this.saveStep1Data(userId, validation.sanitizedData);
      case 2:
        return this.saveStep2Data(userId, validation.sanitizedData);
      case 3:
        return this.saveStep3Data(userId, validation.sanitizedData);
      case 4:
        return this.saveStep4Data(userId, validation.sanitizedData);
      case 5:
        return this.saveStep5Data(userId, validation.sanitizedData);
      case 6:
        return this.saveStep6Data(userId, validation.sanitizedData);
      default:
        throw new Error('Invalid step number');
    }
  }

  // Audit logging methods
  static async logActivationAction(userId: string, action: AuditAction): Promise<void> {
    try {
      // Get current profile for reference (with error handling)
      let profile: UserActivationProfile | null = null;
      try {
        profile = await this.getUserActivationProfile(userId);
      } catch (error) {
        // If we can't get the profile, continue with audit logging anyway
        console.warn('Could not get profile for audit logging:', error);
      }

      const auditEntry = {
        user_id: userId,
        activation_profile_id: profile?.id,
        action_type: action.actionType,
        step_number: action.stepNumber,
        field_name: action.fieldName,
        old_value: action.oldValue ? JSON.stringify(action.oldValue) : null,
        new_value: action.newValue ? JSON.stringify(action.newValue) : null,
        ip_address: null, // Would be populated from request context in real implementation
        user_agent: null, // Would be populated from request context in real implementation
      };

      const { error } = await supabase
        .from('activation_audit_log')
        .insert(auditEntry);

      if (error) {
        DatabaseErrorHandler.handleAuditError(error);
      }
    } catch (error) {
      DatabaseErrorHandler.handleAuditError(error);
    }
  }

  // Status management with validation
  static async updateActivationStatus(userId: string, status: ActivationStatus, reason?: string): Promise<void> {
    const currentProfile = await this.getUserActivationProfile(userId);

    if (!currentProfile) {
      throw new Error('Activation profile not found');
    }

    // Validate status transition
    const validTransitions: Record<ActivationStatus, ActivationStatus[]> = {
      'pending': ['in_progress', 'rejected'],
      'in_progress': ['completed', 'rejected', 'pending'],
      'completed': ['rejected'], // Can only reject completed profiles
      'rejected': ['pending', 'in_progress'] // Can restart rejected profiles
    };

    const currentStatus = currentProfile.activation_status as ActivationStatus;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    // Log the status change
    await this.logActivationAction(userId, {
      actionType: 'status_change',
      fieldName: 'activation_status',
      oldValue: currentStatus,
      newValue: status,
      metadata: { reason }
    });

    // Update the status
    const updateData: Partial<UserActivationProfile> = {
      activation_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('user_activation_profiles')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update activation status: ${error.message}`);
    }
  }

  // Enhanced data retrieval with validation status
  static async getCompleteActivationData(userId: string): Promise<CompleteActivationData> {
    const batchData = await this.getBatchProfileData(userId);

    // Determine validation status
    let validationStatus: 'valid' | 'invalid' | 'pending' = 'pending';

    if (batchData.profile) {
      // Check if all steps are completed and valid
      const stepsToValidate = [1, 2, 3, 4, 5, 6];
      let allStepsValid = true;

      for (const step of stepsToValidate) {
        const stepData = this.getStepDataFromProfile(batchData.profile, step);
        if (stepData) {
          const validation = this.validateStepData(step, stepData);
          if (!validation.isValid) {
            allStepsValid = false;
            break;
          }
        } else {
          allStepsValid = false;
          break;
        }
      }

      validationStatus = allStepsValid ? 'valid' : 'invalid';
    }

    return {
      profile: batchData.profile,
      documents: batchData.documents,
      progress: batchData.progress,
      isComplete: batchData.isComplete,
      validationStatus
    };
  }

  // Helper method to extract step data from profile
  private static getStepDataFromProfile(profile: UserActivationProfile, step: number): any {
    switch (step) {
      case 1:
        if (!profile.full_name) return null;
        return {
          gender: profile.gender,
          fullName: profile.full_name,
          dateOfBirth: profile.date_of_birth ? {
            day: new Date(profile.date_of_birth).getDate().toString(),
            month: (new Date(profile.date_of_birth).getMonth() + 1).toString(),
            year: new Date(profile.date_of_birth).getFullYear().toString()
          } : null,
          maritalStatus: profile.marital_status,
          nationality: profile.nationality,
          agreedToTerms: profile.agreed_to_terms
        };
      case 2:
        return profile.family_relatives ? { familyRelatives: profile.family_relatives } : null;
      case 3:
        if (!profile.residing_country) return null;
        return {
          residingCountry: profile.residing_country,
          stateRegionProvince: profile.state_region_province,
          townCity: profile.town_city
        };
      case 4:
        if (!profile.id_number) return null;
        return {
          idType: profile.id_type,
          idNumber: profile.id_number,
          frontImage: null,
          backImage: null,
          selfieImage: null,
          passportPhoto: null,
          driverLicensePhoto: null
        };
      case 5:
        if (!profile.account_number) return null;
        return {
          accountType: profile.account_type,
          bankName: profile.bank_name,
          accountNumber: profile.account_number,
          accountHolderName: profile.account_holder_name
        };
      case 6:
        return profile.signature_data ? { signature: profile.signature_data } : null;
      default:
        return null;
    }
  }

  // Get user's activation profile
  static async getUserActivationProfile(userId: string): Promise<UserActivationProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_activation_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        DatabaseErrorHandler.handleActivationError(error);
      }

      return data;
    } catch (error) {
      if (DatabaseErrorHandler.isRetryableError(error)) {
        console.warn('Retryable error getting activation profile:', error);
        return null; // Allow graceful degradation
      }
      DatabaseErrorHandler.handleActivationError(error);
    }
  }

  // Create or update activation profile
  static async upsertActivationProfile(userId: string, profileData: Partial<UserActivationProfile>): Promise<UserActivationProfile> {
    try {
      const existingProfile = await this.getUserActivationProfile(userId);

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_activation_profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          DatabaseErrorHandler.handleActivationError(error);
        }

        return data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('user_activation_profiles')
          .insert({
            user_id: userId,
            activation_status: 'in_progress',
            current_step: 1,
            ...profileData
          })
          .select()
          .single();

        if (error) {
          DatabaseErrorHandler.handleActivationError(error);
        }

        return data;
      }
    } catch (error) {
      DatabaseErrorHandler.handleActivationError(error);
    }
  }

  // Save Step 1 data
  static async saveStep1Data(userId: string, step1Data: Step1Data): Promise<UserActivationProfile> {
    const currentProfile = await this.getUserActivationProfile(userId);

    const profileData = {
      gender: step1Data.gender,
      full_name: step1Data.fullName,
      date_of_birth: `${step1Data.dateOfBirth.year}-${step1Data.dateOfBirth.month.padStart(2, '0')}-${step1Data.dateOfBirth.day.padStart(2, '0')}`,
      marital_status: step1Data.maritalStatus ? step1Data.maritalStatus.toLowerCase() : undefined,
      nationality: step1Data.nationality,
      agreed_to_terms: step1Data.agreedToTerms,
      current_step: Math.max(2, currentProfile?.current_step || 1),
      activation_status: currentProfile?.activation_status || 'in_progress'
    };

    return this.upsertActivationProfile(userId, profileData);
  }

  // Save Step 2 data
  static async saveStep2Data(userId: string, step2Data: Step2Data): Promise<UserActivationProfile> {
    const currentProfile = await this.getUserActivationProfile(userId);

    const profileData = {
      family_relatives: step2Data.familyRelatives,
      current_step: Math.max(3, currentProfile?.current_step || 1),
      activation_status: currentProfile?.activation_status || 'in_progress'
    };

    return this.upsertActivationProfile(userId, profileData);
  }

  // Save Step 3 data
  static async saveStep3Data(userId: string, step3Data: Step3Data): Promise<UserActivationProfile> {
    const currentProfile = await this.getUserActivationProfile(userId);

    const profileData = {
      residing_country: step3Data.residingCountry,
      state_region_province: step3Data.stateRegionProvince,
      town_city: step3Data.townCity,
      current_step: Math.max(4, currentProfile?.current_step || 1),
      activation_status: currentProfile?.activation_status || 'in_progress'
    };

    return this.upsertActivationProfile(userId, profileData);
  }

  // Save Step 4 data (ID information only, files handled separately)
  static async saveStep4Data(userId: string, step4Data: Omit<Step4Data, 'frontImage' | 'backImage' | 'selfieImage' | 'passportPhoto' | 'driverLicensePhoto'> | Step4Data): Promise<UserActivationProfile> {
    const currentProfile = await this.getUserActivationProfile(userId);

    // Save the basic profile data
    const profileData = {
      id_type: step4Data.idType,
      id_number: step4Data.idNumber,
      current_step: Math.max(5, currentProfile?.current_step || 1),
      activation_status: currentProfile?.activation_status || 'in_progress'
    };

    return this.upsertActivationProfile(userId, profileData);
  }

  // Save Step 5 data
  static async saveStep5Data(userId: string, step5Data: Step5Data): Promise<UserActivationProfile> {
    const currentProfile = await this.getUserActivationProfile(userId);

    const profileData = {
      account_type: step5Data.accountType,
      bank_name: step5Data.bankName,
      account_number: step5Data.accountNumber,
      account_holder_name: step5Data.accountHolderName,
      current_step: Math.max(6, currentProfile?.current_step || 1),
      activation_status: currentProfile?.activation_status || 'in_progress'
    };

    return this.upsertActivationProfile(userId, profileData);
  }

  // Save Step 6 data and complete activation
  static async saveStep6Data(userId: string, step6Data: Step6Data): Promise<UserActivationProfile> {
    // Validate all previous steps before completing
    const currentProfile = await this.getUserActivationProfile(userId);

    if (!currentProfile) {
      throw new Error('Activation profile not found');
    }

    // Check if all previous steps are completed
    const requiredSteps = [1, 2, 3, 4, 5];
    for (const step of requiredSteps) {
      const stepData = this.getStepDataFromProfile(currentProfile, step);
      if (!stepData) {
        throw new Error(`Step ${step} must be completed before finalizing activation`);
      }

      const validation = this.validateStepData(step, stepData);
      if (!validation.isValid) {
        throw new Error(`Step ${step} has validation errors that must be resolved`);
      }
    }

    const profileData = {
      signature_data: step6Data.signature,
      current_step: 6,
      activation_status: 'completed',
      completed_at: new Date().toISOString(),
      validation_status: 'valid',
      last_validated_at: new Date().toISOString()
    };

    // Log completion
    await this.logActivationAction(userId, {
      actionType: 'status_change',
      stepNumber: 6,
      fieldName: 'activation_status',
      oldValue: currentProfile.activation_status,
      newValue: 'completed',
      metadata: {
        completedAt: profileData.completed_at,
        allStepsValidated: true
      }
    });

    return this.upsertActivationProfile(userId, profileData);
  }

  // Upload and save document
  static async uploadDocument(
    userId: string,
    file: File,
    documentType: string,
    activationProfileId?: string
  ): Promise<UserDocument> {
    try {
      // Validate file first
      FileUploadErrorHandler.validateFile(file, documentType);

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}/${documentType}_${Date.now()}.${fileExtension}`;

      console.log(`📁 Uploading file: ${fileName}`);

      // First, ensure the bucket exists and create it if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'user-documents');

      if (!bucketExists) {
        console.log('📦 Creating user-documents bucket...');
        const { error: bucketError } = await supabase.storage.createBucket('user-documents', {
          public: false,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB
        });

        if (bucketError) {
          console.error('❌ Failed to create bucket:', bucketError);
          // Continue anyway, bucket might already exist
        }
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        FileUploadErrorHandler.handleUploadError(uploadError, documentType);
      }

      console.log('✅ File uploaded successfully:', uploadData);

      // Log document upload
      await this.logActivationAction(userId, {
        actionType: 'document_upload',
        fieldName: 'document',
        newValue: {
          documentType,
          fileName: file.name,
          fileSize: file.size,
          filePath: uploadData.path
        }
      });

      // Save document record to database
      const { data, error } = await supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          activation_profile_id: activationProfileId,
          document_type: documentType,
          document_category: this.getDocumentCategory(documentType),
          original_filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          verification_status: 'pending',
          processing_status: 'uploaded',
          is_required: this.isDocumentRequired(documentType)
        })
        .select()
        .single();

      if (error) {
        DatabaseErrorHandler.handleDocumentError(error);
      }

      console.log('✅ Document record saved:', data);
      return data;
    } catch (error: any) {
      if (error.message?.includes('validation') || error.message?.includes('File')) {
        throw error; // Re-throw validation errors as-is
      }
      FileUploadErrorHandler.handleUploadError(error, documentType);
    }
  }

  // Helper method to determine document category
  private static getDocumentCategory(documentType: string): string {
    const categoryMap: Record<string, string> = {
      'id_front': 'identity',
      'id_back': 'identity',
      'passport_photo': 'identity',
      'driver_license': 'identity',
      'selfie': 'identity',
      'signature': 'signature',
      'bank_statement': 'financial',
      'address_proof': 'address'
    };

    return categoryMap[documentType] || 'identity';
  }

  // Helper method to determine if document is required
  private static isDocumentRequired(documentType: string): boolean {
    const requiredDocs = ['id_front', 'id_back', 'selfie', 'signature'];
    return requiredDocs.includes(documentType);
  }

  // Get user documents
  static async getUserDocuments(userId: string): Promise<UserDocument[]> {
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error getting user documents:', error);
        // Return empty array instead of throwing error
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Connection error getting user documents:', error);
      // Return empty array on connection issues
      return [];
    }
  }

  // Get document download URL
  static async getDocumentUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error || !data?.signedUrl) {
        console.error('Error generating document URL:', error);
        throw new Error('Failed to generate document URL');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Connection error generating document URL:', error);
      throw new Error('Failed to generate document URL');
    }
  }

  // Check if user activation is complete
  static async isActivationComplete(userId: string): Promise<boolean> {
    const profile = await this.getUserActivationProfile(userId);
    return profile?.activation_status === 'completed';
  }

  // Get activation progress percentage
  static async getActivationProgress(userId: string): Promise<number> {
    const profile = await this.getUserActivationProfile(userId);
    if (!profile) return 0;

    const currentStep = profile.current_step;
    const totalSteps = 6;

    if (profile.activation_status === 'completed') return 100;

    return Math.round(((currentStep - 1) / totalSteps) * 100);
  }



  // Optimized batch method for profile page - single query approach
  static async getBatchProfileData(userId: string): Promise<{
    profile: UserActivationProfile | null;
    documents: UserDocument[];
    documentsByType: Record<string, UserDocument[]>;
    progress: number;
    isComplete: boolean;
    stats: {
      totalDocuments: number;
      verifiedDocuments: number;
      pendingDocuments: number;
    };
  }> {
    try {
      console.log('=== ActivationService.getBatchProfileData ===');
      console.log('User ID:', userId);

      // Execute both queries in parallel for maximum performance
      const [profileResult, documentsResult] = await Promise.allSettled([
        supabase
          .from('user_activation_profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      console.log('Profile query result:', profileResult.status, profileResult.status === 'fulfilled' ? 'success' : profileResult.reason);
      console.log('Documents query result:', documentsResult.status, documentsResult.status === 'fulfilled' ? `${documentsResult.value.data?.length || 0} docs` : documentsResult.reason);

      // Handle profile result
      const profile = (profileResult.status === 'fulfilled' && !profileResult.value.error)
        ? profileResult.value.data
        : null;

      // Handle documents result
      const documents = (documentsResult.status === 'fulfilled' && !documentsResult.value.error)
        ? (documentsResult.value.data || [])
        : [];

      // Group documents by type
      const documentsByType = documents.reduce((acc: Record<string, UserDocument[]>, doc: UserDocument) => {
        if (!acc[doc.document_type]) {
          acc[doc.document_type] = [];
        }
        acc[doc.document_type].push(doc);
        return acc;
      }, {});

      // Calculate stats
      const stats = {
        totalDocuments: documents.length,
        verifiedDocuments: documents.filter(doc => doc.verification_status === 'verified').length,
        pendingDocuments: documents.filter(doc => doc.verification_status === 'pending').length,
      };

      // Calculate progress and completion
      let progress = 0;
      let isComplete = false;

      if (profile) {
        if (profile.activation_status === 'completed') {
          progress = 100;
          isComplete = true;
        } else {
          progress = Math.round(((profile.current_step - 1) / 6) * 100);
          isComplete = false;
        }
      }

      return {
        profile,
        documents,
        documentsByType,
        progress,
        isComplete,
        stats
      };
    } catch (error) {
      console.error('Error in getBatchProfileData:', error);
      // Return safe defaults
      return {
        profile: null,
        documents: [],
        documentsByType: {},
        progress: 0,
        isComplete: false,
        stats: {
          totalDocuments: 0,
          verifiedDocuments: 0,
          pendingDocuments: 0
        }
      };
    }
  }

  // Get documents by type for easy access
  static async getDocumentsByType(userId: string): Promise<Record<string, UserDocument[]>> {
    const documents = await this.getUserDocuments(userId);

    return documents.reduce((acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = [];
      }
      acc[doc.document_type].push(doc);
      return acc;
    }, {} as Record<string, UserDocument[]>);
  }

  // Cross-session data synchronization
  static async syncActivationData(userId: string): Promise<{
    profile: UserActivationProfile | null;
    documents: UserDocument[];
    lastSyncTime: string;
    hasChanges: boolean;
  }> {
    try {
      const completeData = await this.getCompleteActivationData(userId);

      return {
        profile: completeData.profile,
        documents: completeData.documents,
        lastSyncTime: new Date().toISOString(),
        hasChanges: true // In a real implementation, this would compare with local data
      };
    } catch (error) {
      console.error('Error syncing activation data:', error);
      throw new Error('Failed to sync activation data');
    }
  }

  // Validate complete activation profile
  static async validateCompleteProfile(userId: string): Promise<{
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    completionPercentage: number;
  }> {
    const profile = await this.getUserActivationProfile(userId);

    if (!profile) {
      return {
        isValid: false,
        errors: [{
          field: 'profile',
          code: 'NOT_FOUND',
          message: 'Activation profile not found',
          severity: 'error'
        }],
        warnings: [],
        completionPercentage: 0
      };
    }

    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];
    let completedSteps = 0;
    const totalSteps = 6;

    // Validate each step
    for (let step = 1; step <= totalSteps; step++) {
      const stepData = this.getStepDataFromProfile(profile, step);

      if (stepData) {
        const validation = this.validateStepData(step, stepData);
        allErrors.push(...validation.errors);
        allWarnings.push(...validation.warnings);

        if (validation.isValid) {
          completedSteps++;
        }
      }
    }

    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      isValid: allErrors.length === 0 && completedSteps === totalSteps,
      errors: allErrors,
      warnings: allWarnings,
      completionPercentage
    };
  }

  // Get activation audit logs for a user
  static async getActivationAuditLogs(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('activation_audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return (data || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        activationProfileId: log.activation_profile_id,
        action: {
          actionType: log.action_type,
          stepNumber: log.step_number,
          fieldName: log.field_name,
          oldValue: log.old_value ? JSON.parse(log.old_value) : undefined,
          newValue: log.new_value ? JSON.parse(log.new_value) : undefined
        },
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at
      }));
    } catch (error) {
      console.error('Error in getActivationAuditLogs:', error);
      return [];
    }
  }
}