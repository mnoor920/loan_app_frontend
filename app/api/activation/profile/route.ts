import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ActivationService } from '@/lib/activation-service';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get activation data
    const activationData = await ActivationService.getCompleteActivationData(decoded.userId);

    return NextResponse.json({
      profile: activationData.profile,
      progress: activationData.progress,
      isComplete: activationData.isComplete,
      documents: activationData.documents
    });

  } catch (error: any) {
    console.error('Activation profile API error:', error);
    
    // Handle JWT errors specifically
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch activation profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Parse request body
    const body = await request.json();
    const { step, data } = body;

    if (!step || !data) {
      return NextResponse.json(
        { error: 'Step and data are required' },
        { status: 400 }
      );
    }

    if (step < 1 || step > 6) {
      return NextResponse.json(
        { error: 'Invalid step number. Must be between 1 and 6' },
        { status: 400 }
      );
    }

    console.log(`💾 Saving step ${step} data for user ${decoded.userId}:`, data);

    // Save step data with validation
    const profile = await ActivationService.saveStepDataWithValidation(
      decoded.userId,
      step,
      data
    );

    console.log(`✅ Step ${step} data saved successfully:`, profile);

    // Get updated complete activation data
    const activationData = await ActivationService.getCompleteActivationData(decoded.userId);

    return NextResponse.json({
      success: true,
      profile: activationData.profile,
      progress: activationData.progress,
      isComplete: activationData.isComplete,
      message: `Step ${step} data saved successfully`
    });

  } catch (error: any) {
    console.error('Activation profile save error:', error);
    
    // Handle JWT errors specifically
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Handle validation errors
    if (error.message?.includes('Validation failed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error.message?.includes('Database') || error.message?.includes('database')) {
      return NextResponse.json(
        { error: 'Database error occurred. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save activation data. Please try again.' },
      { status: 500 }
    );
  }
}