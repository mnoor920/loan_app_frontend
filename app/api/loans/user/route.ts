import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie (fallback)
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          loans: [],
          stats: {
            totalBalance: 0,
            totalLoanAmount: 0,
            nextPaymentDue: null,
            activeLoansCount: 0,
            pendingLoansCount: 0,
            completedLoansCount: 0,
          },
          message: 'Authentication required. Please log in to view your loans.'
        },
        { status: 401 }
      );
    }

    // Proxy request to backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${API_URL}/api/loans/user${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        }
      });

      const data = await response.json();

      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('Error proxying to backend:', error);
      return NextResponse.json(
        {
          success: false,
          loading: false,
          message: 'Failed to connect to loan service',
          loans: [],
          stats: {
            totalBalance: 0,
            totalLoanAmount: 0,
            nextPaymentDue: null,
            activeLoansCount: 0,
            pendingLoansCount: 0,
            completedLoansCount: 0,
          }
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        loans: [],
        stats: {
          totalBalance: 0,
          totalLoanAmount: 0,
          nextPaymentDue: null,
          activeLoansCount: 0,
          pendingLoansCount: 0,
          completedLoansCount: 0,
        }
      },
      { status: 500 }
    );
  }
}