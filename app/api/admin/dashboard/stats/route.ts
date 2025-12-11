import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = request.cookies;
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Proxy request to backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        cache: 'no-store'
      });

      const data = await response.json();

      // Transform the backend response to match the expected frontend format
      if (data.success && data.stats) {
        const backendStats = data.stats;
        const totalLoanAmount = backendStats.loans?.totalAmount || 0;
        const totalLoanApplications = backendStats.loans?.total || 0;

        const transformedStats = {
          totalUsers: backendStats.users || 0,
          activatedUsers: backendStats.activation?.completed || 0,
          pendingActivations: (backendStats.activation?.inProgress || 0) + (backendStats.activation?.pending || 0),
          totalLoanApplications: totalLoanApplications,
          pendingLoans: backendStats.loans?.pending || 0,
          approvedLoans: backendStats.loans?.approved || 0,
          rejectedLoans: backendStats.loans?.rejected || 0,
          totalLoanAmount: totalLoanAmount,
          averageLoanAmount: totalLoanApplications > 0 ? totalLoanAmount / totalLoanApplications : 0
        };

        return NextResponse.json({
          success: true,
          stats: transformedStats
        }, { status: 200 });
      }

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