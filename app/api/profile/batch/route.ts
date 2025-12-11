import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ActivationService } from '@/lib/activation-service';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface BatchProfileResponse {
  profile: any;
  activationSteps: any;
  preferences: any;
  documents: any[];
  documentsByType: Record<string, any[]>;
  progress: number;
  isComplete: boolean;
  stats: {
    totalDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    console.log('=== /api/profile/batch Debug ===');
    console.log('Token present:', !!token);

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    console.log('Decoded user ID:', decoded.userId);
    console.log('Decoded email:', decoded.email);

    try {
      // Set timeout for database operations to prevent hanging
      const dbTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 3000)
      );

      // Use optimized batch method for single query approach
      const batchDataPromise = ActivationService.getBatchProfileData(decoded.userId);

      const batchData = await Promise.race([
        batchDataPromise,
        dbTimeout
      ]);

      const batchResult = batchData as any;
      
      console.log('Batch data received:', {
        hasProfile: !!batchResult.profile,
        documentsCount: batchResult.documents?.length || 0,
        progress: batchResult.progress,
        isComplete: batchResult.isComplete
      });

      // Extract data from optimized batch result
      const { profile, documents, documentsByType, progress, isComplete, stats } = batchResult;

      // Create activation steps summary for quick access
      const activationSteps = profile ? {
        currentStep: profile.current_step,
        completedSteps: profile.current_step - 1,
        totalSteps: 6,
        status: profile.activation_status,
        completedAt: profile.completed_at,
        stepsData: {
          step1: {
            completed: !!(profile.full_name && profile.date_of_birth),
            data: {
              fullName: profile.full_name,
              gender: profile.gender,
              dateOfBirth: profile.date_of_birth,
              maritalStatus: profile.marital_status,
              nationality: profile.nationality
            }
          },
          step2: {
            completed: !!(profile.family_relatives && profile.family_relatives.length > 0),
            data: {
              familyRelatives: profile.family_relatives || []
            }
          },
          step3: {
            completed: !!(profile.residing_country && profile.town_city),
            data: {
              residingCountry: profile.residing_country,
              stateRegionProvince: profile.state_region_province,
              townCity: profile.town_city
            }
          },
          step4: {
            completed: !!(profile.id_type && profile.id_number),
            data: {
              idType: profile.id_type,
              idNumber: profile.id_number
            }
          },
          step5: {
            completed: !!(profile.bank_name && profile.account_number),
            data: {
              accountType: profile.account_type,
              bankName: profile.bank_name,
              accountNumber: profile.account_number,
              accountHolderName: profile.account_holder_name
            }
          },
          step6: {
            completed: !!profile.signature_data,
            data: {
              signature: profile.signature_data
            }
          }
        }
      } : null;

      // User preferences (placeholder for future expansion)
      const preferences = {
        theme: 'light',
        notifications: true,
        language: 'en'
      };

      const response: BatchProfileResponse = {
        profile,
        activationSteps,
        preferences,
        documents,
        documentsByType,
        progress,
        isComplete,
        stats
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
          'Content-Type': 'application/json'
        }
      });

    } catch (timeoutError) {
      console.log('Database query timed out, returning fallback data');
      
      // Return minimal fallback data structure
      const fallbackResponse: BatchProfileResponse = {
        profile: null,
        activationSteps: null,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        },
        documents: [],
        documentsByType: {},
        progress: 0,
        isComplete: false,
        stats: {
          totalDocuments: 0,
          verifiedDocuments: 0,
          pendingDocuments: 0
        }
      };

      return NextResponse.json(fallbackResponse, {
        headers: {
          'Cache-Control': 'private, max-age=60', // Shorter cache for fallback data
          'Content-Type': 'application/json'
        }
      });
    }

  } catch (error: any) {
    console.error('Batch profile API error:', error);
    
    // Handle JWT errors specifically
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}