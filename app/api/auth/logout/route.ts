// Force dynamic rendering to ensure this route is always handled as a server route
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    // Clear the auth token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('Logout error:', error)

    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}