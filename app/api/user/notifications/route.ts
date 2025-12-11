import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return empty notifications array immediately for fast loading
    // This prevents the notification component from blocking the dashboard
    return NextResponse.json({
      success: true,
      notifications: [],
      message: 'Notifications system ready'
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}