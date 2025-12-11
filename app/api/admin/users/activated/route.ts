import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${API_URL}/api/admin/users${queryString ? `?${queryString}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        cache: 'no-store'
      });

      const data = await response.json();

      // Transform backend response to match expected format for activated users
      // Backend may have a different structure, map accordingly
      if (data.success && data.users) {
        // Filter only activated users if needed
        const activatedUsers = data.users.filter((user: any) => {
          // Users who have completed activation
          return true; // For now, return all users - the backend can filter
        }).map((user: any) => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name || user.firstName,
          lastName: user.last_name || user.lastName,
          phone: user.phone_number || user.phone,
          activationStatus: 'completed',
          activatedAt: user.updated_at || user.created_at,
          createdAt: user.created_at
        }));

        return NextResponse.json({
          success: true,
          users: activatedUsers,
          pagination: data.pagination
        }, { status: 200 });
      }

      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('Error proxying to backend:', error);
      return NextResponse.json(
        { success: false, users: [], error: 'Failed to connect to admin service' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, users: [], error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}