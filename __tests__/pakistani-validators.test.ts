import { 
  validatePakistaniPhone, 
  validatePakistaniIBAN, 
  validatePakistaniNIC,
  formatPakistaniPhone,
  formatIBAN
} from '../lib/pakistani-validators';

describe('Pakistani Phone Validation', () => {
  describe('validatePakistaniPhone', () => {
    test('should validate correct Pakistani phone numbers', () => {
      const validNumbers = [
        '03001234567',
        '03121234567',
        '03331234567',
        '03451234567'
      ];

      validNumbers.forEach(number => {
        const result = validatePakistaniPhone(number);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should reject invalid Pakistani phone numbers', () => {
      const invalidNumbers = [
        '02001234567', // doesn't start with 03
        '0300123456',  // too short
        '030012345678', // too long
        '04001234567', // invalid prefix
        '3001234567',  // missing leading 0
        '+923001234567', // international format not supported
        '03-00-1234567', // with dashes
        '0300 123 4567', // with spaces
        '', // empty
        '03aa1234567', // contains letters
      ];

      invalidNumbers.forEach(number => {
        const result = validatePakistaniPhone(number);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should handle null and undefined inputs', () => {
      expect(validatePakistaniPhone(null as any).isValid).toBe(false);
      expect(validatePakistaniPhone(undefined as any).isValid).toBe(false);
    });
  });

  describe('formatPakistaniPhone', () => {
    test('should format valid phone numbers with dashes', () => {
      expect(formatPakistaniPhone('03001234567')).toBe('0300-1234567');
      expect(formatPakistaniPhone('03121234567')).toBe('0312-1234567');
    });

    test('should return original string for invalid numbers', () => {
      expect(formatPakistaniPhone('invalid')).toBe('invalid');
      expect(formatPakistaniPhone('02001234567')).toBe('02001234567');
    });
  });
});

describe('Pakistani IBAN Validation', () => {
  describe('validatePakistaniIBAN', () => {
    test('should validate correct Pakistani IBAN numbers', () => {
      const validIBANs = [
        'PK36SCBL0000001123456702',
        'PK89HABB0000001234567890',
        'PK12UNIL0000001234567890',
        'pk36scbl0000001123456702', // lowercase
        'PK 36 SCBL 0000 0011 2345 6702', // with spaces
      ];

      validIBANs.forEach(iban => {
        const result = validatePakistaniIBAN(iban);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.formattedIBAN).toBeDefined();
      });
    });

    test('should reject invalid Pakistani IBAN numbers', () => {
      const invalidIBANs = [
        'IN36SCBL0000001123456702', // wrong country code
        'PK36SCBL000000112345670', // too short
        'PK36SCBL00000011234567022', // too long
        'PK36SCB0000001123456702', // invalid bank code length
        'PK36SCBL000000112345670A', // contains letters in account number
        '', // empty
        'PK', // too short
        '1234567890123456789012345', // no country code
      ];

      invalidIBANs.forEach(iban => {
        const result = validatePakistaniIBAN(iban);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should handle null and undefined inputs', () => {
      expect(validatePakistaniIBAN(null as any).isValid).toBe(false);
      expect(validatePakistaniIBAN(undefined as any).isValid).toBe(false);
    });
  });

  describe('formatIBAN', () => {
    test('should format IBAN with spaces every 4 characters', () => {
      expect(formatIBAN('PK36SCBL0000001123456702')).toBe('PK36 SCBL 0000 0011 2345 6702');
      expect(formatIBAN('pk36scbl0000001123456702')).toBe('PK36 SCBL 0000 0011 2345 6702');
    });

    test('should handle IBANs with existing spaces', () => {
      expect(formatIBAN('PK36 SCBL 0000 0011 2345 6702')).toBe('PK36 SCBL 0000 0011 2345 6702');
    });
  });
});

describe('Pakistani NIC Validation', () => {
  describe('validatePakistaniNIC', () => {
    test('should validate correct Pakistani NIC numbers', () => {
      const validNICs = [
        '12345-1234567-1',
        '54321-9876543-2',
        '11111-2222222-3',
        '99999-8888888-9'
      ];

      validNICs.forEach(nic => {
        const result = validatePakistaniNIC(nic);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.formattedNIC).toBe(nic);
      });
    });

    test('should reject invalid Pakistani NIC numbers', () => {
      const invalidNICs = [
        '1234-1234567-1', // area code too short
        '123456-1234567-1', // area code too long
        '12345-123456-1', // serial number too short
        '12345-12345678-1', // serial number too long
        '12345-1234567-12', // check digit too long
        '12345-1234567', // missing check digit
        '12345-1234567-', // empty check digit
        '00000-1234567-1', // all zeros area code
        '12345-0000000-1', // all zeros serial number
        '12345-1234567-A', // letter in check digit
        'ABCDE-1234567-1', // letters in area code
        '12345-ABCDEFG-1', // letters in serial number
        '', // empty
        '12345/1234567/1', // wrong separators
        '123451234567l', // no separators
      ];

      invalidNICs.forEach(nic => {
        const result = validatePakistaniNIC(nic);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should handle null and undefined inputs', () => {
      expect(validatePakistaniNIC(null as any).isValid).toBe(false);
      expect(validatePakistaniNIC(undefined as any).isValid).toBe(false);
    });
  });
});