import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-utils';

// Force dynamic rendering on Vercel
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie (fallback)
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Proxy request to external backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${API_URL}/api/activation/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}` // Send token as cookie to backend
        },
        cache: 'no-store'
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('Error proxying to backend:', error);
      return NextResponse.json(
        { error: 'Failed to connect to activation service' },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('Activation profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activation profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie (fallback)
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Proxy request to external backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${API_URL}/api/activation/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}` // Send token as cookie to backend
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('Error proxying to backend:', error);
      return NextResponse.json(
        { error: 'Failed to connect to activation service' },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('Activation profile save error:', error);
    return NextResponse.json(
      { error: 'Failed to save activation data. Please try again.' },
      { status: 500 }
    );
  }
}