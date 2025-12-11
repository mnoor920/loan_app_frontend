import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AdminAuthResult {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  error?: {
    status: number;
    message: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Verify admin authentication from request cookies
 * @param request - NextRequest object
 * @returns AdminAuthResult with admin info or error details
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        error: {
          status: 401,
          message: 'Authentication required. Please log in to access admin features.'
        }
      };
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (jwtError: any) {
      console.error('JWT verification error:', jwtError);
      
      let message = 'Invalid authentication token. Please log in again.';
      if (jwtError.name === 'TokenExpiredError') {
        message = 'Authentication token has expired. Please log in again.';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = 'Invalid authentication token format. Please log in again.';
      }

      return {
        success: false,
        error: {
          status: 401,
          message
        }
      };
    }

    // Check if user has admin role
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return {
        success: false,
        error: {
          status: 403,
          message: 'Access denied. Administrator privileges required to access this resource.'
        }
      };
    }

    // Handle super admin
    if (decoded.userId === 'superadmin') {
      return {
        success: true,
        admin: {
          id: 'superadmin',
          email: process.env.SUPER_ADMIN_EMAIL!,
          role: 'superadmin',
          name: 'Super Admin'
        }
      };
    }

    // Return admin info
    return {
      success: true,
      admin: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: `${decoded.role.charAt(0).toUpperCase() + decoded.role.slice(1)}`
      }
    };

  } catch (error: any) {
    console.error('Admin authentication error:', error);
    return {
      success: false,
      error: {
        status: 500,
        message: 'Authentication service error. Please try again later.'
      }
    };
  }
}

/**
 * Middleware function to check admin authentication
 * Returns a response if authentication fails, or null if successful
 * @param request - NextRequest object
 * @returns Response object if auth fails, null if successful
 */
export async function requireAdminAuth(request: NextRequest): Promise<Response | null> {
  const authResult = await verifyAdminAuth(request);
  
  if (!authResult.success) {
    return new Response(
      JSON.stringify({
        success: false,
        message: authResult.error!.message
      }),
      {
        status: authResult.error!.status,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  return null;
}

/**
 * Get admin info from request (assumes auth has already been verified)
 * @param request - NextRequest object
 * @returns Admin info or null
 */
export async function getAdminFromRequest(request: NextRequest) {
  const authResult = await verifyAdminAuth(request);
  return authResult.success ? authResult.admin : null;
}

/**
 * Check if the current user has specific admin permissions
 * @param admin - Admin object from verifyAdminAuth
 * @param requiredRole - Required role ('admin' or 'superadmin')
 * @returns boolean indicating if user has required permissions
 */
export function hasAdminPermission(admin: { role: string }, requiredRole: 'admin' | 'superadmin' = 'admin'): boolean {
  if (requiredRole === 'superadmin') {
    return admin.role === 'superadmin';
  }
  
  return admin.role === 'admin' || admin.role === 'superadmin';
}

/**
 * Create standardized admin error response
 * @param status - HTTP status code
 * @param message - Error message
 * @param details - Optional additional error details
 * @returns Response object
 */
export function createAdminErrorResponse(status: number, message: string, details?: any): Response {
  const responseBody: any = {
    success: false,
    message
  };

  if (details) {
    responseBody.error = details;
  }

  return new Response(
    JSON.stringify(responseBody),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Create standardized admin success response
 * @param data - Response data
 * @param message - Success message
 * @returns Response object
 */
export function createAdminSuccessResponse(data: any, message: string = 'Operation completed successfully.'): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
      message
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}