import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ActivationService } from '@/lib/activation-service';
import { SimpleFileStorage } from '@/lib/simple-file-storage';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;

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

    // Get the document with timeout
    const documents = await ActivationService.getUserDocuments(decoded.userId);
    const document = documents.find(doc => doc.id === id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify the document belongs to the authenticated user
    if (document.user_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    try {
      // Get document data (base64) with timeout handling
      const fileData = await SimpleFileStorage.getDocumentData(id, decoded.userId);

      return NextResponse.json({
        url: fileData, // This is the base64 data URL
        document: {
          id: document.id,
          type: document.document_type,
          filename: document.original_filename,
          size: document.file_size,
          mimeType: document.mime_type
        }
      });
    } catch (docError: any) {
      console.error('Document data retrieval error:', docError);

      if (docError.message.includes('timeout') || docError.message.includes('terminated')) {
        return NextResponse.json(
          { error: 'Document loading timed out. Please try again in a moment.' },
          { status: 408 } // Request Timeout
        );
      }

      return NextResponse.json(
        { error: 'Failed to load document data' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Get document URL error:', error);

    if (error.message.includes('timeout') || error.message.includes('terminated')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get document URL' },
      { status: 500 }
    );
  }
}