import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = request.cookies;
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const loanId = params.id;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      // Map the status to backend's expected format
      let action = 'reject';
      if (body.status === 'Approved' || body.status === 'approved') {
        action = 'approve';
      }

      const response = await fetch(`${API_URL}/api/loans/${loanId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify({
          action,
          reason: body.reason || body.adminNotes
        })
      });

      const data = await response.json();

      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('Error proxying to backend:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to connect to admin service' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Also support POST for backwards compatibility
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PATCH(request, { params });
}