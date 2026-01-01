import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: { withdrawalId: string } }
) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Read body with proper error handling
    let body: any = {};
    try {
      const contentType = request.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await request.text();
          // Handle empty string, "{}", or actual content
          if (text && text.trim() && text.trim() !== '{}') {
            body = JSON.parse(text);
          } else if (text && text.trim() === '{}') {
            // Explicitly empty object - this is valid
            body = {};
          }
          // If text is empty string, body remains {}
        } catch (parseError) {
          // If JSON.parse fails, body remains {}
          console.log('Body parsing note:', parseError instanceof Error ? parseError.message : 'Unknown error');
        }
      }
    } catch (e) {
      console.error('Error reading request body:', e);
      // body remains {} - this is fine, all fields are optional
    }

    console.log('Forwarding approve request:', { withdrawalId: params.withdrawalId, body });

    const response = await fetch(`${API_URL}/api/admin/withdrawals/${params.withdrawalId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || data.error || 'Failed to approve withdrawal' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in approve withdrawal API route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

