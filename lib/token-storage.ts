/**
 * Token Storage Utility
 * Manages JWT token storage in localStorage
 */

const TOKEN_KEY = 'auth-token';

export const tokenStorage = {
  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
      return null;
    }
  },

  /**
   * Save token to localStorage
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token to localStorage:', error);
    }
  },

  /**
   * Remove token from localStorage
   */
  removeToken(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token from localStorage:', error);
    }
  },

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }
};

