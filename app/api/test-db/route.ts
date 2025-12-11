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

    // Test database connection and operations
    const testResults = {
      userId: decoded.userId,
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };

    try {
      // Test 1: Get existing profile
      const existingProfile = await ActivationService.getUserActivationProfile(decoded.userId);
      testResults.tests.push({
        test: 'Get existing profile',
        success: true,
        result: existingProfile ? 'Profile found' : 'No profile found',
        data: existingProfile
      });

      // Test 2: Create/update a test profile
      const testProfileData = {
        full_name: 'Test User',
        gender: 'male',
        current_step: 1
      };

      const savedProfile = await ActivationService.upsertActivationProfile(decoded.userId, testProfileData);
      testResults.tests.push({
        test: 'Save test profile',
        success: true,
        result: 'Profile saved successfully',
        data: savedProfile
      });

      // Test 3: Get documents
      const documents = await ActivationService.getUserDocuments(decoded.userId);
      testResults.tests.push({
        test: 'Get user documents',
        success: true,
        result: `Found ${documents.length} documents`,
        data: documents
      });

    } catch (error: any) {
      testResults.tests.push({
        test: 'Database operations',
        success: false,
        error: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json(testResults);

  } catch (error: any) {
    console.error('Test DB error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}