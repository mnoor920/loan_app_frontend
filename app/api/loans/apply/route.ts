import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { LoanService } from '@/lib/loan-service';
import {
  LoanApplicationRequest,
  LoanApplicationResponse,
  LOAN_CONSTANTS
} from '@/types/loan';
import {
  calculateLoanPayment,
  validateLoanAmount,
  validateLoanDuration
} from '@/lib/loan-calculations';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = request.cookies;
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required. Please log in to apply for a loan.'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Proxy request to backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${API_URL}/api/loans/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('Error proxying to backend:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to connect to loan service' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// GET method to check if loan service is available
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies for authentication
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required.'
        },
        { status: 401 }
      );
    }

    // Verify JWT token
    try {
      jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid authentication token.'
        },
        { status: 401 }
      );
    }

    // Check if loan service is ready
    const isReady = await LoanService.isServiceReady();

    return NextResponse.json({
      success: true,
      serviceReady: isReady,
      loanLimits: {
        minAmount: LOAN_CONSTANTS.MIN_LOAN_AMOUNT,
        maxAmount: LOAN_CONSTANTS.MAX_LOAN_AMOUNT,
        availableDurations: LOAN_CONSTANTS.AVAILABLE_DURATIONS,
        interestRate: LOAN_CONSTANTS.DEFAULT_INTEREST_RATE
      }
    });

  } catch (error: any) {
    console.error('Loan service check error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check loan service status.'
      },
      { status: 500 }
    );
  }
}