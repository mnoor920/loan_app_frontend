import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ActivationService } from '@/lib/activation-service';
import { SimpleFileStorage } from '@/lib/simple-file-storage';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const activationProfileId = formData.get('activationProfileId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // Upload document using simple file storage (base64)
    const document = await SimpleFileStorage.saveDocument(
      decoded.userId,
      file,
      documentType,
      activationProfileId || undefined
    );

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        type: document.document_type,
        filename: document.original_filename,
        size: document.file_size,
        status: document.verification_status
      }
    });

  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}