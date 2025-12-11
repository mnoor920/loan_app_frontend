import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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

    const loanId = params.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${API_URL}/api/admin/loans/${loanId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        cache: 'no-store'
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

export async function PUT(
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

    const loanId = params.id;
    const body = await request.json();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      // Determine if this is a status update (approve/reject)
      const action = body.status === 'Approved' ? 'approve' : body.status === 'Rejected' ? 'reject' : null;

      if (action) {
        // Use the admin status endpoint for approve/reject
        const response = await fetch(`${API_URL}/api/admin/loans/${loanId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `auth-token=${token}`
          },
          body: JSON.stringify({
            action,
            reason: body.adminNotes || body.reason
          })
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } else {
        // For other updates, use PUT on the admin loan details endpoint
        const response = await fetch(`${API_URL}/api/admin/loans/${loanId}/details`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `auth-token=${token}`
          },
          body: JSON.stringify(body)
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      }
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