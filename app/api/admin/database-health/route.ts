import { NextRequest } from 'next/server';
import { requireAdminAuth, createAdminErrorResponse, createAdminSuccessResponse } from '@/lib/admin-auth';
import { checkDatabaseHealth, autoSetupDatabase, getSetupInstructions } from '@/lib/database-setup-verification';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    // Check database health
    const health = await checkDatabaseHealth();

    return createAdminSuccessResponse(
      {
        health,
        setupInstructions: health.isHealthy ? null : getSetupInstructions()
      },
      health.isHealthy ? 'Database is healthy' : 'Database setup required'
    );

  } catch (error: any) {
    console.error('Database health check error:', error);
    return createAdminErrorResponse(500, 'Failed to check database health');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    // Attempt auto-setup
    const setupResult = await autoSetupDatabase();

    if (setupResult.success) {
      return createAdminSuccessResponse(
        { setupResult },
        setupResult.message
      );
    } else {
      return createAdminErrorResponse(500, setupResult.message);
    }

  } catch (error: any) {
    console.error('Database auto-setup error:', error);
    return createAdminErrorResponse(500, 'Failed to setup database');
  }
}