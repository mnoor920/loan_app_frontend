import { useState, useEffect, useCallback } from 'react';

interface FastDashboardResponse {
  success: boolean;
  message?: string;
  stats: {
    totalLoanAmount: number;
    activeLoansCount: number;
    pendingLoansCount: number;
    completedLoansCount: number;
    nextPaymentDue: string | null;
  };
  recentLoans: Array<{
    id: string;
    loanAmount: number;
    monthlyPayment: number;
    status: string;
    applicationDate: string;
  }>;
}

interface UseFastDashboardOptions {
  userId: string | null;
  enabled?: boolean;
}

interface UseFastDashboardReturn {
  data: FastDashboardResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: number | null;
  cacheAge: number | null;
}

export function useFastDashboard({
  userId,
  enabled = true,
}: UseFastDashboardOptions): UseFastDashboardReturn {
  const [data, setData] = useState<FastDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    if (!enabled || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/fast', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result: FastDashboardResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }

      setData(result);
      setLastUpdated(Date.now());
      setError(null);

    } catch (err: any) {
      console.error('Dashboard data loading error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [enabled, userId]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  // Auto-refresh every 5 seconds to get updated loan status
useEffect(() => {
  if (!enabled || !userId) return;

  const interval = setInterval(() => {
    fetchDashboardData();
  }, 5000); // refresh every 5 seconds

  return () => clearInterval(interval);
}, [enabled, userId, fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    cacheAge: null,
  };
}