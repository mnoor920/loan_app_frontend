import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { LoanService } from '@/lib/loan-service';
import { LoanDetailsResponse } from '@/types/loan';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: loanId } = params;

    // Validate loan ID parameter
    if (!loanId || typeof loanId !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid loan ID provided.' 
        } as LoanDetailsResponse,
        { status: 400 }
      );
    }

    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication required. Please log in to view loan details.' 
        } as LoanDetailsResponse,
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid authentication token. Please log in again.' 
        } as LoanDetailsResponse,
        { status: 401 }
      );
    }

    try {
      // Fetch loan details with user ownership verification
      const loan = await LoanService.getLoanById(loanId, decoded.userId);

      if (!loan) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Loan not found or you do not have permission to view this loan.' 
          } as LoanDetailsResponse,
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          loan,
          message: 'Loan details retrieved successfully.'
        } as LoanDetailsResponse,
        { status: 200 }
      );

    } catch (dbError: any) {
      console.error('Database error during loan details retrieval:', dbError);

      // Handle specific database errors
      if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Loan service is currently unavailable. Please try again later.' 
          } as LoanDetailsResponse,
          { status: 503 }
        );
      }

      if (dbError.message.includes('connection') || dbError.message.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Database connection issue. Please try again in a few moments.' 
          } as LoanDetailsResponse,
          { status: 503 }
        );
      }

      // Generic database error
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to retrieve loan details. Please try again later.' 
        } as LoanDetailsResponse,
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Loan details retrieval error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An unexpected error occurred. Please try again later.' 
      } as LoanDetailsResponse,
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: loanId } = params;

    // Validate loan ID parameter
    if (!loanId || typeof loanId !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid loan ID provided.' 
        } as LoanDetailsResponse,
        { status: 400 }
      );
    }

    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication required.' 
        } as LoanDetailsResponse,
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid authentication token.' 
        } as LoanDetailsResponse,
        { status: 401 }
      );
    }

    // Parse request body
    let updateData: any;
    try {
      updateData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid request format.' 
        } as LoanDetailsResponse,
        { status: 400 }
      );
    }

    try {
      // For regular users, only allow limited updates (like cancellation)
      // Admin users would have more permissions (handled in admin routes)
      const allowedUpdates: any = {};

      // Users can only cancel pending loans
      if (updateData.status === 'Rejected' && decoded.role === 'user') {
        // First check if loan is in pending status
        const existingLoan = await LoanService.getLoanById(loanId, decoded.userId);
        if (!existingLoan) {
          return NextResponse.json(
            { 
              success: false,
              message: 'Loan not found.' 
            } as LoanDetailsResponse,
            { status: 404 }
          );
        }

        if (existingLoan.status !== 'Pending Approval') {
          return NextResponse.json(
            { 
              success: false,
              message: 'Only pending loans can be cancelled.' 
            } as LoanDetailsResponse,
            { status: 400 }
          );
        }

        allowedUpdates.status = 'Rejected';
      } else {
        return NextResponse.json(
          { 
            success: false,
            message: 'You do not have permission to make this update.' 
          } as LoanDetailsResponse,
          { status: 403 }
        );
      }

      // Update the loan
      const updatedLoan = await LoanService.updateLoan(loanId, decoded.userId, allowedUpdates);

      return NextResponse.json(
        {
          success: true,
          loan: updatedLoan,
          message: 'Loan updated successfully.'
        } as LoanDetailsResponse,
        { status: 200 }
      );

    } catch (dbError: any) {
      console.error('Database error during loan update:', dbError);

      // Handle specific database errors
      if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Loan service is currently unavailable.' 
          } as LoanDetailsResponse,
          { status: 503 }
        );
      }

      if (dbError.message.includes('connection') || dbError.message.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Database connection issue. Please try again.' 
          } as LoanDetailsResponse,
          { status: 503 }
        );
      }

      // Generic database error
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to update loan. Please try again later.' 
        } as LoanDetailsResponse,
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Loan update error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An unexpected error occurred. Please try again later.' 
      } as LoanDetailsResponse,
      { status: 500 }
    );
  }
}