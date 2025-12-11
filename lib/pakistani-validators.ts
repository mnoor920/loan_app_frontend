interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
}

interface IBANValidationResult {
  isValid: boolean;
  error?: string;
  formattedIBAN?: string;
}

interface NICValidationResult {
  isValid: boolean;
  error?: string;
  formattedNIC?: string;
}

/**
 * Validates Pakistani phone numbers in format 03XXXXXXXXX (11 digits total)
 */
export const validatePakistaniPhone = (phone: string): PhoneValidationResult => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all spaces, dashes, and other non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Check if it starts with 03 and has exactly 11 digits
  if (!cleanPhone.startsWith('03')) {
    return { isValid: false, error: 'Please enter a valid Pakistani phone number (03XXXXXXXXX)' };
  }

  if (cleanPhone.length !== 11) {
    return { isValid: false, error: 'Please enter a valid Pakistani phone number (03XXXXXXXXX)' };
  }

  // Additional validation for valid Pakistani mobile prefixes
  const validPrefixes = ['030', '031', '032', '033', '034', '035', '036', '037', '038', '039'];
  const prefix = cleanPhone.substring(0, 3);
  
  if (!validPrefixes.includes(prefix)) {
    return { isValid: false, error: 'Please enter a valid Pakistani phone number (03XXXXXXXXX)' };
  }

  return { isValid: true };
};

/**
 * Validates Pakistani IBAN format
 */
export const validatePakistaniIBAN = (iban: string): IBANValidationResult => {
  if (!iban || typeof iban !== 'string') {
    return { isValid: false, error: 'IBAN is required' };
  }

  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Check if it starts with PK
  if (!cleanIBAN.startsWith('PK')) {
    return { isValid: false, error: 'Please enter a valid Pakistani IBAN (e.g., PK36SCBL0000001123456702)' };
  }

  // Pakistani IBAN should be 24 characters long
  if (cleanIBAN.length !== 24) {
    return { isValid: false, error: 'Please enter a valid Pakistani IBAN (e.g., PK36SCBL0000001123456702)' };
  }

  // Basic IBAN format validation (PK + 2 check digits + 4 bank code + 16 account number)
  const ibanRegex = /^PK\d{2}[A-Z]{4}\d{16}$/;
  if (!ibanRegex.test(cleanIBAN)) {
    return { isValid: false, error: 'Please enter a valid Pakistani IBAN (e.g., PK36SCBL0000001123456702)' };
  }

  // Format IBAN with spaces for display
  const formattedIBAN = cleanIBAN.replace(/(.{4})/g, '$1 ').trim();

  return { isValid: true, formattedIBAN };
};

/**
 * Validates Pakistani NIC format (XXXXX-XXXXXXX-X)
 */
export const validatePakistaniNIC = (nic: string): NICValidationResult => {
  if (!nic || typeof nic !== 'string') {
    return { isValid: false, error: 'NIC number is required' };
  }

  // Remove spaces and convert to string
  const cleanNIC = nic.trim();

  // Check for basic NIC format: 5 digits - 7 digits - 1 digit
  const nicRegex = /^\d{5}-\d{7}-\d{1}$/;
  if (!nicRegex.test(cleanNIC)) {
    return { isValid: false, error: 'Please enter a valid NIC number (XXXXX-XXXXXXX-X)' };
  }

  // Additional validation: check if the NIC parts are valid
  const parts = cleanNIC.split('-');
  const [area, serial, checkDigit] = parts;

  // Area code should not be all zeros
  if (area === '00000') {
    return { isValid: false, error: 'Please enter a valid NIC number (XXXXX-XXXXXXX-X)' };
  }

  // Serial number should not be all zeros
  if (serial === '0000000') {
    return { isValid: false, error: 'Please enter a valid NIC number (XXXXX-XXXXXXX-X)' };
  }

  return { isValid: true, formattedNIC: cleanNIC };
};

/**
 * Formats a phone number for display (adds dashes)
 */
export const formatPakistaniPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('03')) {
    return `${cleanPhone.substring(0, 4)}-${cleanPhone.substring(4)}`;
  }
  return phone;
};

/**
 * Formats an IBAN for display (adds spaces every 4 characters)
 */
export const formatIBAN = (iban: string): string => {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
  return cleanIBAN.replace(/(.{4})/g, '$1 ').trim();
};