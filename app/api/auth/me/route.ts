import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmailOrPhone } from '@/lib/simple-auth'
import { getTokenFromRequest, verifyToken, type JWTPayload } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie (fallback)
    const token = getTokenFromRequest(request)

    // Debug logging
    console.log('=== /api/auth/me Debug ===')
    console.log('Authorization header:', request.headers.get('authorization')?.substring(0, 30) + '...')
    console.log('All cookies:', request.cookies.getAll())
    console.log('Auth token present:', !!token)

    if (!token) {
      console.log('No token found in Authorization header or cookies!')
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = verifyToken(token)

    // Handle super admin
    if (decoded.userId === 'superadmin') {
      return NextResponse.json({
        user: {
          id: 'superadmin',
          email: process.env.SUPER_ADMIN_EMAIL!,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'superadmin'
        }
      })
    }

    // Get user from database
    const user = await getUserByEmailOrPhone(decoded.email)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    })

  } catch (error: any) {
    console.error('Auth check error:', error)

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}