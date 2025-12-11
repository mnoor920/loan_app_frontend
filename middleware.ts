import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

interface JWTPayload {
  userId: string
  email: string
  role: string
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  console.log('Middleware running for:', pathname)
  console.log('Token present:', !!token)

  // If no token, redirect to login (since we only run on protected routes now)
  if (!token) {
    console.log('No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  const decoded = await verifyToken(token)

  console.log('Token decoded:', !!decoded)

  // If token is invalid, redirect to login
  if (!decoded) {
    console.log('Invalid token, redirecting to login')
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  // Role-based access control for admin routes
  if (pathname.startsWith('/admin') && decoded.role !== 'superadmin') {
    return NextResponse.redirect(new URL('/userdashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup|landing|$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}