import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivationProvider } from '../contexts/ActivationContext';
import Step1 from '../components/activation/step1';
import Step2 from '../components/activation/step2';
import Step4 from '../components/activation/step4';
import Step5 from '../components/activation/step5';

// Mock file reading for tests
global.FileReader = class {
  readAsDataURL = jest.fn(() => {
    this.onloadend?.({ target: { result: 'data:image/png;base64,mock' } } as any);
  });
  onloadend: ((event: any) => void) | null = null;
} as any;

describe('Activation Flow Integration Tests', () => {
  const mockProps = {
    onNext: jest.fn(),
    onBack: jest.fn(),
    onClose: jest.fn(),
    onFinish: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1 - Personal Information', () => {
    test('should validate and save personal information', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step1 onNext={mockProps.onNext} onClose={mockProps.onClose} />
        </ActivationProvider>
      );

      // Fill out the form
      await user.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
      
      // Select date of birth
      await user.selectOptions(screen.getByDisplayValue('Day'), '15');
      await user.selectOptions(screen.getByDisplayValue('Month'), '6');
      await user.selectOptions(screen.getByDisplayValue('Year'), '1990');
      
      // Select marital status
      await user.selectOptions(screen.getByDisplayValue('Select marital status'), 'Single');
      
      // Agree to terms
      await user.click(screen.getByRole('checkbox'));
      
      // Submit
      await user.click(screen.getByText('Continue'));

      expect(mockProps.onNext).toHaveBeenCalledWith({
        gender: 'male',
        fullName: 'John Doe',
        dateOfBirth: { day: '15', month: '6', year: '1990' },
        maritalStatus: 'Single',
        nationality: 'Pakistani',
        agreedToTerms: true
      });
    });

    test('should show validation errors for incomplete form', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step1 onNext={mockProps.onNext} onClose={mockProps.onClose} />
        </ActivationProvider>
      );

      // Try to submit without filling required fields
      await user.click(screen.getByText('Continue'));

      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Complete date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Marital status is required')).toBeInTheDocument();
      expect(screen.getByText('You must agree to the terms')).toBeInTheDocument();
      expect(mockProps.onNext).not.toHaveBeenCalled();
    });
  });

  describe('Step 2 - Character References', () => {
    test('should validate Pakistani phone numbers', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step2 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // Fill out reference information
      await user.type(screen.getByPlaceholderText('Full name'), 'Jane Doe');
      await user.type(screen.getByPlaceholderText('Relationship'), 'Sister');
      await user.type(screen.getByPlaceholderText('03XXXXXXXXX'), '03001234567');
      
      // Submit
      await user.click(screen.getByText('Continue'));

      expect(mockProps.onNext).toHaveBeenCalledWith({
        familyRelatives: [{
          fullName: 'Jane Doe',
          relationship: 'Sister',
          phoneNumber: '03001234567'
        }]
      });
    });

    test('should show error for invalid Pakistani phone number', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step2 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // Fill out with invalid phone number
      await user.type(screen.getByPlaceholderText('Full name'), 'Jane Doe');
      await user.type(screen.getByPlaceholderText('Relationship'), 'Sister');
      await user.type(screen.getByPlaceholderText('03XXXXXXXXX'), '02001234567'); // Invalid prefix
      
      // Submit
      await user.click(screen.getByText('Continue'));

      expect(screen.getByText(/Reference 1: Please enter a valid Pakistani phone number/)).toBeInTheDocument();
      expect(mockProps.onNext).not.toHaveBeenCalled();
    });

    test('should allow adding multiple references', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step2 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // Add another reference
      await user.click(screen.getByText('+ Add Another Reference'));

      // Should now have 2 reference forms
      expect(screen.getAllByText('Reference')).toHaveLength(2);
    });
  });

  describe('Step 4 - ID Verification', () => {
    test('should validate NIC number format', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step4 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // Fill NIC number
      await user.type(screen.getByPlaceholderText('XXXXX-XXXXXXX-X'), '12345-1234567-1');
      
      // Try to submit without images (should show validation errors)
      await user.click(screen.getByText('Continue'));

      expect(screen.getByText('Front NIC image is required')).toBeInTheDocument();
      expect(screen.getByText('Back NIC image is required')).toBeInTheDocument();
      expect(screen.getByText('Selfie image is required')).toBeInTheDocument();
    });

    test('should show error for invalid NIC format', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step4 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // Fill invalid NIC number
      await user.type(screen.getByPlaceholderText('XXXXX-XXXXXXX-X'), '1234-1234567-1'); // Invalid format
      
      await user.click(screen.getByText('Continue'));

      expect(screen.getByText(/Please enter a valid NIC number/)).toBeInTheDocument();
    });

    test('should only show NIC as ID type', () => {
      render(
        <ActivationProvider>
          <Step4 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // ID Type field should be disabled and show only NIC
      const idTypeField = screen.getByDisplayValue('NIC');
      expect(idTypeField).toBeDisabled();
    });
  });

  describe('Step 5 - Bank Account Information', () => {
    test('should validate IBAN for bank accounts', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step5 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // Select bank account type (should be default)
      expect(screen.getByText('Bank Account')).toBeInTheDocument();
      
      // Fill bank details
      await user.selectOptions(screen.getByDisplayValue('Select an option'), 'HBL (Habib Bank Limited)');
      await user.type(screen.getByPlaceholderText('PK36SCBL0000001123456702'), 'PK36SCBL0000001123456702');
      await user.type(screen.getByPlaceholderText('As it appears on your account'), 'John Doe');
      
      await user.click(screen.getByText('Continue'));

      expect(mockProps.onNext).toHaveBeenCalledWith({
        accountType: 'bank',
        bankName: 'HBL (Habib Bank Limited)',
        accountNumber: 'PK36SCBL0000001123456702',
        accountHolderName: 'John Doe'
      });
    });

    test('should validate Pakistani phone number for e-wallet', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step5 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // Switch to e-wallet
      await user.click(screen.getByText('E-Wallet'));
      
      // Fill e-wallet details
      await user.selectOptions(screen.getByDisplayValue('Select an option'), 'JazzCash');
      await user.type(screen.getByPlaceholderText('03XXXXXXXXX'), '03001234567');
      await user.type(screen.getByPlaceholderText('As it appears on your account'), 'John Doe');
      
      await user.click(screen.getByText('Continue'));

      expect(mockProps.onNext).toHaveBeenCalledWith({
        accountType: 'ewallet',
        bankName: 'JazzCash',
        accountNumber: '03001234567',
        accountHolderName: 'John Doe'
      });
    });

    test('should show error for invalid IBAN', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivationProvider>
          <Step5 
            onNext={mockProps.onNext} 
            onBack={mockProps.onBack} 
            onClose={mockProps.onClose} 
          />
        </ActivationProvider>
      );

      // Fill invalid IBAN
      await user.selectOptions(screen.getByDisplayValue('Select an option'), 'HBL (Habib Bank Limited)');
      await user.type(screen.getByPlaceholderText('PK36SCBL0000001123456702'), 'INVALID_IBAN');
      await user.type(screen.getByPlaceholderText('As it appears on your account'), 'John Doe');
      
      await user.click(screen.getByText('Continue'));

      expect(screen.getByText(/Please enter a valid Pakistani IBAN/)).toBeInTheDocument();
      expect(mockProps.onNext).not.toHaveBeenCalled();
    });
  });

  describe('Data Persistence', () => {
    test('should restore form data when navigating back', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage
      const mockStorage: { [key: string]: string } = {};
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (key: string) => mockStorage[key] || null,
          setItem: (key: string, value: string) => { mockStorage[key] = value; },
          removeItem: (key: string) => { delete mockStorage[key]; },
        }
      });

      // First render Step 1 and fill data
      const { rerender } = render(
        <ActivationProvider>
          <Step1 onNext={mockProps.onNext} onClose={mockProps.onClose} />
        </ActivationProvider>
      );

      await user.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
      await user.selectOptions(screen.getByDisplayValue('Day'), '15');
      await user.selectOptions(screen.getByDisplayValue('Month'), '6');
      await user.selectOptions(screen.getByDisplayValue('Year'), '1990');
      await user.selectOptions(screen.getByDisplayValue('Select marital status'), 'Single');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByText('Continue'));

      // Simulate navigation to Step 2 and back to Step 1
      rerender(
        <ActivationProvider>
          <Step1 onNext={mockProps.onNext} onClose={mockProps.onClose} />
        </ActivationProvider>
      );

      // Data should be restored
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('15')).toBeInTheDocument();
        expect(screen.getByDisplayValue('6')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1990')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Single')).toBeInTheDocument();
      });
    });
  });
});