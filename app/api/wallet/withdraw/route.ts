import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie (auth-token)
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, code } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Trim and validate code
    const trimmedCode = code?.toString().trim();
    if (!trimmedCode || trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid code. Code must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Forward to backend
    const response = await fetch(`${API_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`,
      },
      body: JSON.stringify({ amount, code: trimmedCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Extract error message from backend response
      let errorMessage = data.error || data.message || 'Failed to process withdrawal';
      
      // Ensure we return a proper error message, not "Internal server error"
      if (errorMessage.includes('Internal Server Error') || errorMessage.includes('Internal server error')) {
        errorMessage = data.error || 'An error occurred while processing your withdrawal. Please try again.';
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error processing wallet withdrawal:', error);
    
    // Provide a more helpful error message
    let errorMessage = 'An error occurred while processing your withdrawal. Please try again or contact support.';
    
    if (error.message && !error.message.includes('Internal')) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

