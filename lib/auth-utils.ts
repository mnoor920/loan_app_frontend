/**
 * Authentication Utilities
 * Helper functions for extracting and validating tokens from requests
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Extract token from request (checks Authorization header first, then cookies as fallback)
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // First, try to get token from Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Fallback to cookie (for backward compatibility)
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // No localStorage on server; if ever running on client, guard accordingly
  if (typeof window !== 'undefined') {
    const lsToken = window.localStorage.getItem('auth-token');
    if (lsToken) return lsToken;
  }

  return null;
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new Error('Invalid or expired token');
    }
    throw error;
  }
}

/**
 * Get authenticated user from request
 * Returns decoded token payload or null if not authenticated
 */
export function getAuthenticatedUser(request: NextRequest): JWTPayload | null {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return null;
    }
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

