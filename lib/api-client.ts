/**
 * API Client Utility
 * Provides a centralized way to make authenticated API requests
 */

import { tokenStorage } from './token-storage';

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
  const requestHeaders: HeadersInit = {
    ...headers,
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
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
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
