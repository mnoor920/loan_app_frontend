import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie (auth-token)
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Forward to backend
    const response = await fetch(`${API_URL}/api/wallet/withdrawals`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch withdrawals' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching wallet withdrawals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

