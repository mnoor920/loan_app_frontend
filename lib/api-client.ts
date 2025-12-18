/**
 * API Client Utility
 * Provides a centralized way to make authenticated API requests
 */

import { tokenStorage } from './token-storage';
import { AdminError, ErrorType, getUserFriendlyMessage, getSuggestedActions, parseApiError } from './error-handling';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean; // Set to true to skip adding Authorization header
}

/**
 * Enhanced fetch function that automatically adds Authorization header
 */
export async function apiFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  // Get token from localStorage
  const token = tokenStorage.getToken();

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  // Add Authorization header if token exists and auth is not skipped
  if (!skipAuth && token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Make the request
  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });

  // If unauthorized, clear token and redirect to login
  if (response.status === 401 && !skipAuth) {
    tokenStorage.removeToken();
    // Only redirect if we're in the browser
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return response;
}

/**
 * Convenience method for JSON requests
 */
export async function apiFetchJson<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await apiFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Parse as AdminError for consistent error handling
    throw await parseApiError(response);
  }

  return response.json();
}

/**
 * Convenience method for POST requests
 */
export async function apiPost<T = any>(
  url: string,
  data: any,
  options: FetchOptions = {}
): Promise<T> {
  return apiFetchJson<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Convenience method for GET requests
 */
export async function apiGet<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  return apiFetchJson<T>(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * Admin API Client
 * Provides methods for admin-specific API calls
 */
export class AdminApiClient {
  /**
   * Get activated users
   */
  async getActivatedUsers(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const url = `/api/admin/users/activated${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiFetchJson(url);
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<any> {
    return apiFetchJson(`/api/admin/users/${userId}/profile`);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    data: any,
    updatedBy?: string,
    reason?: string
  ): Promise<any> {
    return apiFetchJson(`/api/admin/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, updatedBy, reason }),
    });
  }

  /**
   * Delete user document
   */
  async deleteUserDocument(userId: string, documentId: string): Promise<any> {
    return apiFetchJson(`/api/admin/users/${userId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Replace user document
   */
  async replaceUserDocument(
    userId: string,
    documentId: string,
    formData: FormData
  ): Promise<any> {
    const token = tokenStorage.getToken();
    const response = await fetch(`/api/admin/users/${userId}/documents/${documentId}/replace`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get document content
   */
  async getDocumentContent(documentId: string): Promise<Blob> {
    const response = await apiFetch(`/api/documents/${documentId}/content`);
    if (!response.ok) {
      throw await parseApiError(response);
    }
    return response.blob();
  }

  /**
   * Get all loans
   */
  async getAllLoans(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/api/admin/loans/all${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiFetchJson(url);
  }

  /**
   * Get current withdrawal code for a loan
   */
  async getWithdrawalCode(loanId: string): Promise<any> {
    return apiFetchJson(`/api/admin/loans/${loanId}/withdrawal-code`);
  }

  /**
   * Generate withdrawal code
   */
  async generateWithdrawalCode(loanId: string): Promise<any> {
    return apiFetchJson(`/api/admin/loans/${loanId}/withdrawal-code`, {
      method: 'POST',
    });
  }

  /**
   * Set withdrawal code manually
   */
  async setWithdrawalCode(loanId: string, code: string): Promise<any> {
    return apiFetchJson(`/api/admin/loans/${loanId}/withdrawal-code`, {
      method: 'PUT',
      body: JSON.stringify({ code }),
    });
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(): Promise<any> {
    return apiFetchJson('/api/admin/dashboard/stats');
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient();

/**
 * Get error display message for AdminError
 */
export function getErrorDisplayMessage(error: AdminError): string {
  return getUserFriendlyMessage(error);
}

/**
 * Get recovery actions for AdminError
 */
export function getRecoveryActions(error: AdminError): string[] {
  return getSuggestedActions(error);
}

/**
 * Handle API errors - converts regular errors to AdminError
 */
export function handleApiError(error: unknown): AdminError {
  if (error instanceof AdminError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AdminError(
      error.message,
      ErrorType.UNKNOWN,
      500,
      undefined,
      error
    );
  }
  
  return new AdminError(
    'An unexpected error occurred',
    ErrorType.UNKNOWN,
    500,
    undefined,
    error
  );
}
