import { useState, useEffect, useCallback } from 'react';

interface UseActivationStatusReturn {
  isAccountActivated: boolean;
  activationProgress: number;
  currentStep: number;
  loadingActivation: boolean;
  activationApiError: boolean;
  refreshActivationStatus: () => Promise<void>;
}

export function useActivationStatus(userId: string | null): UseActivationStatusReturn {
  const [isAccountActivated, setIsAccountActivated] = useState(false);
  const [activationProgress, setActivationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingActivation, setLoadingActivation] = useState(true);
  const [activationApiError, setActivationApiError] = useState(false);

  const loadActivationStatus = useCallback(async () => {
    if (!userId) {
      setLoadingActivation(false);
      return;
    }

    try {
      // Use relative URL to go through Next.js API route (ensures cookies are sent)
      const response = await fetch('/api/activation/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        setIsAccountActivated(data.isComplete || false);
        setActivationProgress(data.progress || 0);
        setCurrentStep(data.profile?.currentStep || 1);
        setActivationApiError(false);
      } else {
        console.log('Activation API not available, using defaults');
        setActivationApiError(true);
        setIsAccountActivated(false);
        setActivationProgress(0);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Failed to load activation status:', error);
      setActivationApiError(true);
      setIsAccountActivated(false);
      setActivationProgress(0);
      setCurrentStep(1);
    } finally {
      setLoadingActivation(false);
    }
  }, [userId]);

  const refreshActivationStatus = useCallback(async () => {
    if (userId) {
      setLoadingActivation(true);
      await loadActivationStatus();
    }
  }, [userId, loadActivationStatus]);

  // Initial load
  useEffect(() => {
    loadActivationStatus();
  }, [loadActivationStatus]);

  return {
    isAccountActivated,
    activationProgress,
    currentStep,
    loadingActivation,
    activationApiError,
    refreshActivationStatus,
  };
}