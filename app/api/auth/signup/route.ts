// Force dynamic rendering to ensure this route is always handled as a server route
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { signUpSchema } from '@/lib/validations'
import { createUser, generateToken, getUserByEmailOrPhone } from '@/lib/simple-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Signup request received:', { ...body, password: '[HIDDEN]' })

    // Validate input
    const validatedData = signUpSchema.parse(body)
    console.log('Validation passed')

    // Check if user already exists
    try {
      const existingUser = await getUserByEmailOrPhone(validatedData.email)
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }
    } catch (error) {
      // User doesn't exist, which is what we want
    }

    // Check if phone number already exists
    try {
      const existingPhone = await getUserByEmailOrPhone(validatedData.phoneNumber)
      if (existingPhone) {
        return NextResponse.json(
          { error: 'User with this phone number already exists' },
          { status: 400 }
        )
      }
    } catch (error) {
      // Phone doesn't exist, which is what we want
    }

    // Create user
    const user = await createUser({
      email: validatedData.email,
      phoneNumber: validatedData.phoneNumber,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      password: validatedData.password
    })

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      phoneNumber: user.phone_number,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    })

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error: any) {
    console.error('Signup error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}