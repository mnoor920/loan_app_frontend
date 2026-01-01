'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '@/lib/api-client';

// Import step data interfaces
interface Step1Data {
  gender: 'male' | 'female';
  fullName: string;
  dateOfBirth: {
    day: string;
    month: string;
    year: string;
  };
  maritalStatus: string;
  nationality: string;
  agreedToTerms: boolean;
}

interface Step2Data {
  familyRelatives: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
  }[];
}

interface Step3Data {
  residingCountry: string;
  stateRegionProvince: string;
  townCity: string;
}

interface Step4Data {
  idType: 'NIC';
  idNumber: string;
  frontImage: File | null;
  backImage: File | null;
  selfieImage: File | null;
  passportPhoto: File | null;
  driverLicensePhoto: File | null;
  electricityBillPhoto: File | null;
}

interface Step5Data {
  accountType: 'bank' | 'ewallet' | 'custom';
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

interface Step6Data {
  signature: string;
}

interface ActivationData {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  step6?: Step6Data;
}

interface StoredActivationData {
  data: ActivationData;
  currentStep: number;
  timestamp: number;
  version: string;
}

interface ActivationContextType {
  data: ActivationData;
  updateStepData: (step: number, stepData: any) => void;
  getStepData: (step: number) => any;
  clearData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const ActivationContext = createContext<ActivationContextType | undefined>(undefined);

const STORAGE_KEY = 'activation_flow_data';
const STORAGE_VERSION = '1.0.0';
const DATA_EXPIRY_HOURS = 24; // Data expires after 24 hours

interface ActivationProviderProps {
  children: ReactNode;
}

export const ActivationProvider: React.FC<ActivationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<ActivationData>({});
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load data from database first, then localStorage as fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = user?.id;

        // If user has changed, clear localStorage data
        if (currentUserId && userId && currentUserId !== userId) {
          console.log('User changed, clearing activation data');
          localStorage.removeItem(STORAGE_KEY);
          setData({});
          setCurrentStep(1);
        }

        setCurrentUserId(userId || null);

        // If no user, clear everything
        if (!userId) {
          setData({});
          setCurrentStep(1);
          setIsLoading(false);
          return;
        }

        // First try to load from database
        const response = await apiFetch('/api/activation/profile');

        if (response.ok) {
          const { profile } = await response.json();

          if (profile) {
            console.log('Loading activation data from database:', profile);
            // Convert database profile to activation data format (backend returns camelCase)
            const activationData: ActivationData = {};

            // Step 1 data
            if (profile.fullName) {
              activationData.step1 = {
                gender: profile.gender || 'male',
                fullName: profile.fullName,
                dateOfBirth: profile.dateOfBirth ? {
                  day: new Date(profile.dateOfBirth).getDate().toString(),
                  month: (new Date(profile.dateOfBirth).getMonth() + 1).toString(),
                  year: new Date(profile.dateOfBirth).getFullYear().toString()
                } : { day: '', month: '', year: '' },
                maritalStatus: profile.maritalStatus || '',
                nationality: profile.nationality || '',
                agreedToTerms: profile.agreedToTerms || false
              };
            }

            // Step 2 data
            if (profile.familyRelatives) {
              activationData.step2 = {
                familyRelatives: profile.familyRelatives
              };
            }

            // Step 3 data
            if (profile.residingCountry) {
              activationData.step3 = {
                residingCountry: profile.residingCountry,
                stateRegionProvince: profile.stateRegionProvince || '',
                townCity: profile.townCity || ''
              };
            }

            // Step 4 data
            if (profile.idNumber) {
              activationData.step4 = {
                idType: profile.idType || 'NIC',
                idNumber: profile.idNumber,
                frontImage: null,
                backImage: null,
                selfieImage: null,
                passportPhoto: null,
                driverLicensePhoto: null,
                electricityBillPhoto: null
              };
            }

            // Step 5 data
            if (profile.accountNumber) {
              activationData.step5 = {
                accountType: profile.accountType || 'bank',
                bankName: profile.bankName || '',
                accountNumber: profile.accountNumber,
                accountHolderName: profile.accountHolderName || ''
              };
            }

            // Step 6 data
            if (profile.signatureData) {
              activationData.step6 = {
                signature: profile.signatureData
              };
            }

            setData(activationData);
            setCurrentStep(profile.currentStep || 1);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to localStorage if database is not available
        console.log('Database not available, loading from localStorage');
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsed: StoredActivationData = JSON.parse(storedData);

          // Check if data is expired
          const now = Date.now();
          const dataAge = now - parsed.timestamp;
          const maxAge = DATA_EXPIRY_HOURS * 60 * 60 * 1000;

          if (dataAge <= maxAge && parsed.version === STORAGE_VERSION) {
            console.log('Loading activation data from localStorage:', parsed.data);
            setData(parsed.data || {});
            setCurrentStep(parsed.currentStep || 1);
          } else {
            console.log('Stored activation data expired, clearing...');
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          console.log('No stored activation data found');
        }
      } catch (error) {
        console.error('Error loading activation data:', error);

        // Try localStorage as final fallback
        try {
          const storedData = localStorage.getItem(STORAGE_KEY);
          if (storedData) {
            const parsed: StoredActivationData = JSON.parse(storedData);
            setData(parsed.data || {});
            setCurrentStep(parsed.currentStep || 1);
          }
        } catch (localError) {
          console.error('Error loading from localStorage:', localError);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, currentUserId]);

  // Save data to localStorage whenever data or currentStep changes
  useEffect(() => {
    if (!isLoading) {
      try {
        const dataToStore: StoredActivationData = {
          data,
          currentStep,
          timestamp: Date.now(),
          version: STORAGE_VERSION
        };
        console.log('Saving activation data to localStorage:', dataToStore);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
        console.log('Activation data saved successfully');
      } catch (error) {
        console.error('Error saving activation data to localStorage:', error);
        // Handle localStorage quota exceeded or other errors
        if (error instanceof DOMException && error.code === 22) {
          setError('Storage quota exceeded. Clearing old data and retrying...');
          // Quota exceeded, try to clear old data and retry
          try {
            localStorage.removeItem(STORAGE_KEY);
            const dataToStore: StoredActivationData = {
              data,
              currentStep,
              timestamp: Date.now(),
              version: STORAGE_VERSION
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
            setError(null); // Clear error if retry succeeds
          } catch (retryError) {
            console.error('Failed to save data even after clearing storage:', retryError);
            setError('Failed to save activation progress. Please try again.');
          }
        } else {
          setError('Failed to save activation progress. Please try again.');
        }
      }
    }
  }, [data, currentStep, isLoading]);

  const updateStepData = async (step: number, stepData: any) => {
    console.log(`🔄 Updating step ${step} data:`, stepData);

    // Handle Step 4 file uploads separately
    if (step === 4 && stepData) {
      console.log(`📁 Processing Step 4 file uploads...`);
      await handleStep4FileUploads(stepData);
    }

    // Update local state first (immediate feedback)
    setData(prevData => {
      const newData = {
        ...prevData,
        [`step${step}`]: stepData
      };
      console.log('📱 Updated local activation data:', newData);
      return newData;
    });

    // Try to save to database (for persistence across sessions)
    try {
      // For step 4, exclude files from the profile save since they're handled separately
      const dataToSave = step === 4 ? {
        idType: stepData.idType,
        idNumber: stepData.idNumber
      } : stepData;

      console.log(`💾 Saving step ${step} to database:`, dataToSave);

      const response = await apiFetch('/api/activation/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step,
          data: dataToSave
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Step ${step} data saved to database successfully:`, result);
      } else {
        const errorText = await response.text();
        console.error(`⚠️ Database save failed for step ${step}:`, response.status, errorText);
      }
    } catch (error) {
      console.error(`❌ Failed to save step ${step} data to database:`, error);
      console.log(`📱 Step ${step} data saved locally only`);
    }
  };

  // Handle Step 4 file uploads
  const handleStep4FileUploads = async (step4Data: any) => {
    const fileFields = [
      { field: 'frontImage', type: 'id_front' },
      { field: 'backImage', type: 'id_back' },
      { field: 'selfieImage', type: 'selfie' },
      { field: 'passportPhoto', type: 'passport_photo' },
      { field: 'driverLicensePhoto', type: 'driver_license' },
      { field: 'electricityBillPhoto', type: 'electricity_bill' }
    ];

    for (const { field, type } of fileFields) {
      const file = step4Data[field];
      if (file && file instanceof File) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('documentType', type);

          const response = await apiFetch('/api/activation/documents/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Uploaded ${type}:`, result.document);
          } else {
            const error = await response.json();
            console.error(`❌ Failed to upload ${type}:`, error.error);
          }
        } catch (error) {
          console.error(`❌ Error uploading ${type}:`, error);
        }
      }
    }
  };

  const getStepData = (step: number) => {
    return data[`step${step}` as keyof ActivationData];
  };

  const clearData = () => {
    setData({});
    setCurrentStep(1);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing activation data from localStorage:', error);
      setError('Failed to clear activation data from storage.');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: ActivationContextType = {
    data,
    updateStepData,
    getStepData,
    clearData,
    currentStep,
    setCurrentStep,
    isLoading,
    error,
    clearError
  };

  return (
    <ActivationContext.Provider value={contextValue}>
      {children}
    </ActivationContext.Provider>
  );
};

export const useActivation = (): ActivationContextType => {
  const context = useContext(ActivationContext);
  if (context === undefined) {
    throw new Error('useActivation must be used within an ActivationProvider');
  }
  return context;
};

// Export types for use in components
export type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step6Data,
  ActivationData
};