import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Server-side: get token from Authorization header or cookie
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    // Proxy to backend which handles storage/RLS with service key
    // Backend expects this path: /api/documents/upload
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/documents/upload`;
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        // Backend expects auth-token cookie
        Cookie: `auth-token=${token}`,
      },
      body: formData,
    });

    const raw = await backendResponse.text();
    const isJson = backendResponse.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? JSON.parse(raw || '{}') : { message: raw };

    return NextResponse.json(payload, { status: backendResponse.status });

  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}