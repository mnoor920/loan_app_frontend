// Validation utility functions for admin forms

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation
export const validateEmail = (email: string): FieldValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Phone validation
export const validatePhone = (phone: string): FieldValidationResult => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' };
  }
  
  if (cleanPhone.length > 15) {
    return { isValid: false, error: 'Phone number must be less than 15 digits' };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name: string, fieldName: string = 'Name'): FieldValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters` };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }
  
  return { isValid: true };
};

// Date validation
export const validateDate = (date: string, fieldName: string = 'Date'): FieldValidationResult => {
  if (!date) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: `Please enter a valid ${fieldName.toLowerCase()}` };
  }
  
  return { isValid: true };
};

// Date of birth validation
export const validateDateOfBirth = (dateOfBirth: string): FieldValidationResult => {
  const dateValidation = validateDate(dateOfBirth, 'Date of birth');
  if (!dateValidation.isValid) {
    return dateValidation;
  }
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    // Subtract 1 from age if birthday hasn't occurred this year
  }
  
  if (birthDate > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }
  
  if (age < 18) {
    return { isValid: false, error: 'User must be at least 18 years old' };
  }
  
  if (age > 120) {
    return { isValid: false, error: 'Please enter a valid date of birth' };
  }
  
  return { isValid: true };
};

// Loan amount validation
export const validateLoanAmount = (amount: string | number): FieldValidationResult => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (!amount || isNaN(numAmount)) {
    return { isValid: false, error: 'Loan amount is required' };
  }
  
  if (numAmount <= 0) {
    return { isValid: false, error: 'Loan amount must be greater than 0' };
  }
  
  if (numAmount < 100) {
    return { isValid: false, error: 'Minimum loan amount is $100' };
  }
  
  if (numAmount > 1000000) {
    return { isValid: false, error: 'Maximum loan amount is $1,000,000' };
  }
  
  return { isValid: true };
};

// Interest rate validation
export const validateInterestRate = (rate: string | number): FieldValidationResult => {
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
  
  if (!rate || isNaN(numRate)) {
    return { isValid: false, error: 'Interest rate is required' };
  }
  
  if (numRate < 0) {
    return { isValid: false, error: 'Interest rate cannot be negative' };
  }
  
  if (numRate > 50) {
    return { isValid: false, error: 'Interest rate cannot exceed 50%' };
  }
  
  return { isValid: true };
};

// Loan duration validation
export const validateLoanDuration = (duration: string | number): FieldValidationResult => {
  const numDuration = typeof duration === 'string' ? parseInt(duration) : duration;
  
  if (!duration || isNaN(numDuration)) {
    return { isValid: false, error: 'Loan duration is required' };
  }
  
  if (numDuration <= 0) {
    return { isValid: false, error: 'Loan duration must be greater than 0' };
  }
  
  if (numDuration < 1) {
    return { isValid: false, error: 'Minimum loan duration is 1 month' };
  }
  
  if (numDuration > 360) {
    return { isValid: false, error: 'Maximum loan duration is 360 months (30 years)' };
  }
  
  return { isValid: true };
};

// Required field validation
export const validateRequired = (value: string, fieldName: string): FieldValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
};

// Admin reason validation
export const validateAdminReason = (reason: string): FieldValidationResult => {
  if (!reason || !reason.trim()) {
    return { isValid: false, error: 'Please provide a reason for this change' };
  }
  
  if (reason.trim().length < 10) {
    return { isValid: false, error: 'Reason must be at least 10 characters long' };
  }
  
  if (reason.trim().length > 500) {
    return { isValid: false, error: 'Reason must be less than 500 characters' };
  }
  
  return { isValid: true };
};

// Nationality validation
export const validateNationality = (nationality: string): FieldValidationResult => {
  if (!nationality || !nationality.trim()) {
    return { isValid: false, error: 'Nationality is required' };
  }
  
  if (nationality.trim().length < 2) {
    return { isValid: false, error: 'Nationality must be at least 2 characters long' };
  }
  
  if (nationality.trim().length > 50) {
    return { isValid: false, error: 'Nationality must be less than 50 characters' };
  }
  
  return { isValid: true };
};

// Address validation
export const validateAddress = (address: string, fieldName: string = 'Address'): FieldValidationResult => {
  if (!address || !address.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (address.trim().length < 5) {
    return { isValid: false, error: `${fieldName} must be at least 5 characters long` };
  }
  
  if (address.trim().length > 200) {
    return { isValid: false, error: `${fieldName} must be less than 200 characters` };
  }
  
  return { isValid: true };
};

// Bank account validation
export const validateBankAccount = (accountNumber: string): FieldValidationResult => {
  if (!accountNumber || !accountNumber.trim()) {
    return { isValid: false, error: 'Account number is required' };
  }
  
  // Remove spaces and hyphens
  const cleanAccount = accountNumber.replace(/[\s\-]/g, '');
  
  if (cleanAccount.length < 8) {
    return { isValid: false, error: 'Account number must be at least 8 characters long' };
  }
  
  if (cleanAccount.length > 20) {
    return { isValid: false, error: 'Account number must be less than 20 characters' };
  }
  
  // Check if it contains only alphanumeric characters
  const accountRegex = /^[a-zA-Z0-9]+$/;
  if (!accountRegex.test(cleanAccount)) {
    return { isValid: false, error: 'Account number can only contain letters and numbers' };
  }
  
  return { isValid: true };
};

// ID number validation
export const validateIdNumber = (idNumber: string, idType: string): FieldValidationResult => {
  if (!idNumber || !idNumber.trim()) {
    return { isValid: false, error: 'ID number is required' };
  }
  
  const cleanId = idNumber.replace(/[\s\-]/g, '');
  
  if (cleanId.length < 5) {
    return { isValid: false, error: 'ID number must be at least 5 characters long' };
  }
  
  if (cleanId.length > 20) {
    return { isValid: false, error: 'ID number must be less than 20 characters' };
  }
  
  // Basic format validation based on ID type
  switch (idType?.toLowerCase()) {
    case 'nic':
      // National ID Card - typically alphanumeric
      if (!/^[a-zA-Z0-9]+$/.test(cleanId)) {
        return { isValid: false, error: 'NIC number can only contain letters and numbers' };
      }
      break;
    case 'passport':
      // Passport - typically alphanumeric
      if (!/^[a-zA-Z0-9]+$/.test(cleanId)) {
        return { isValid: false, error: 'Passport number can only contain letters and numbers' };
      }
      break;
    case 'driver_license':
      // Driver's license - typically alphanumeric
      if (!/^[a-zA-Z0-9]+$/.test(cleanId)) {
        return { isValid: false, error: 'Driver license number can only contain letters and numbers' };
      }
      break;
    default:
      // Generic validation
      if (!/^[a-zA-Z0-9]+$/.test(cleanId)) {
        return { isValid: false, error: 'ID number can only contain letters and numbers' };
      }
  }
  
  return { isValid: true };
};

// Validate user profile form
export const validateUserProfile = (profile: any): ValidationResult => {
  const errors: string[] = [];
  
  // Personal Information
  if (profile.fullName) {
    const nameValidation = validateName(profile.fullName, 'Full name');
    if (!nameValidation.isValid) errors.push(nameValidation.error!);
  }
  
  if (profile.dateOfBirth) {
    const dobValidation = validateDateOfBirth(profile.dateOfBirth);
    if (!dobValidation.isValid) errors.push(dobValidation.error!);
  }
  
  if (profile.nationality) {
    const nationalityValidation = validateNationality(profile.nationality);
    if (!nationalityValidation.isValid) errors.push(nationalityValidation.error!);
  }
  
  // Address
  if (profile.residingCountry) {
    const countryValidation = validateRequired(profile.residingCountry, 'Residing country');
    if (!countryValidation.isValid) errors.push(countryValidation.error!);
  }
  
  if (profile.stateRegionProvince) {
    const stateValidation = validateRequired(profile.stateRegionProvince, 'State/Region/Province');
    if (!stateValidation.isValid) errors.push(stateValidation.error!);
  }
  
  if (profile.townCity) {
    const cityValidation = validateRequired(profile.townCity, 'Town/City');
    if (!cityValidation.isValid) errors.push(cityValidation.error!);
  }
  
  // ID Information
  if (profile.idNumber && profile.idType) {
    const idValidation = validateIdNumber(profile.idNumber, profile.idType);
    if (!idValidation.isValid) errors.push(idValidation.error!);
  }
  
  // Bank Information
  if (profile.accountNumber) {
    const accountValidation = validateBankAccount(profile.accountNumber);
    if (!accountValidation.isValid) errors.push(accountValidation.error!);
  }
  
  if (profile.bankName) {
    const bankValidation = validateRequired(profile.bankName, 'Bank name');
    if (!bankValidation.isValid) errors.push(bankValidation.error!);
  }
  
  if (profile.accountHolderName) {
    const holderValidation = validateName(profile.accountHolderName, 'Account holder name');
    if (!holderValidation.isValid) errors.push(holderValidation.error!);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate loan form
export const validateLoanForm = (loan: any): ValidationResult => {
  const errors: string[] = [];
  
  if (loan.loanAmount) {
    const amountValidation = validateLoanAmount(loan.loanAmount);
    if (!amountValidation.isValid) errors.push(amountValidation.error!);
  }
  
  if (loan.interestRate) {
    const rateValidation = validateInterestRate(loan.interestRate);
    if (!rateValidation.isValid) errors.push(rateValidation.error!);
  }
  
  if (loan.durationMonths) {
    const durationValidation = validateLoanDuration(loan.durationMonths);
    if (!durationValidation.isValid) errors.push(durationValidation.error!);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};