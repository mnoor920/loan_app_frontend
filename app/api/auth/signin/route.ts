import { NextRequest, NextResponse } from 'next/server'
import { signInSchema } from '@/lib/validations'
import { authenticateUser, generateToken } from '@/lib/simple-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signInSchema.parse(body)

    // Authenticate user
    const user = await authenticateUser(validatedData.email, validatedData.password)

    // Generate JWT token
    const token = generateToken(user)

    console.log('=== Signin Debug ===')
    console.log('User authenticated:', user.email)
    console.log('Token generated (first 20 chars):', token.substring(0, 20) + '...')

    // Return token in response body (client will store in localStorage)
    // Also set cookie as fallback for backward compatibility
    const response = NextResponse.json({
      message: 'Login successful',
      token: token, // Send token in response body for localStorage
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      redirectTo: user.role === 'superadmin' ? '/admin/dashboard' : '/userdashboard'
    })

    // Set cookie as fallback (for backward compatibility)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    console.log('Token returned in response body and cookie set as fallback')

    return response

  } catch (error: any) {
    console.error('Signin error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Invalid credentials' },
      { status: 401 }
    )
  }
}