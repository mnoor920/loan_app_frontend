import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

interface ProfileBatchData {
  profile: any;
  activationSteps: any;
  preferences: any;
  documents: any[];
  documentsByType: Record<string, any[]>;
  progress: number;
  isComplete: boolean;
  stats: {
    totalDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
  };
}

interface UseProfileDataReturn {
  data: ProfileBatchData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isFromCache: boolean;
}

export function useProfileData(userId: string | null): UseProfileDataReturn {
  const [data, setData] = useState<ProfileBatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use apiFetch which automatically adds Authorization header from localStorage
      const response = await apiFetch('/api/profile/batch');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const freshData: ProfileBatchData = await response.json();
      setData(freshData);
      setError(null);

    } catch (err: any) {
      console.error('Profile data fetch error:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (userId) {
      await fetchProfileData();
    }
  }, [userId, fetchProfileData]);

  // Initial load
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  return {
    data,
    loading,
    error,
    refresh,
    isFromCache: false,
  };
}