// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = request.cookies;
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'No authentication token found'
        },
        {
          status: 401,
          headers: noCacheHeaders
        }
      );
    }

    // Proxy request to backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${API_URL}/api/loans/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        // Ensure backend request is not cached either
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const backendData = await response.json();

      if (!backendData.success) {
        throw new Error(backendData.message || 'Failed to fetch data from backend');
      }

      // Transform backend data to match FastDashboardResponse structure
      // Backend: { success: true, loans: [...], stats: {...} }
      // Frontend expects: { success: true, recentLoans: [...], stats: {...} }

      const recentLoans = (backendData.loans || []).slice(0, 5).map((loan: any) => ({
        id: loan.id,
        loanAmount: loan.loanAmount,
        monthlyPayment: loan.monthlyPayment,
        status: loan.status,
        applicationDate: loan.applicationDate
      }));

      return NextResponse.json({
        success: true,
        stats: backendData.stats,
        recentLoans
      }, { headers: noCacheHeaders });

    } catch (error) {
      console.error('Error proxying to backend:', error);
      // Return empty state on error so UI doesn't crash
      return NextResponse.json({
        success: true,
        stats: {
          totalLoanAmount: 0,
          activeLoansCount: 0,
          pendingLoansCount: 0,
          completedLoansCount: 0,
          nextPaymentDue: null
        },
        recentLoans: []
      }, {
        status: 200, // Return 200 so UI shows empty state instead of error
        headers: noCacheHeaders
      });
    }

  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error'
      },
      {
        status: 500,
        headers: noCacheHeaders
      }
    );
  }
}