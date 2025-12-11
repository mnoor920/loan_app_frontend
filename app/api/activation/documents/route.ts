import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ActivationService } from '@/lib/activation-service';

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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Upload document
    const document = await ActivationService.uploadDocument(
      decoded.userId,
      file,
      documentType,
      activationProfileId || undefined
    );

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document
    });

  } catch (error: any) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
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

    // Get user documents
    const documents = await ActivationService.getUserDocuments(decoded.userId);

    // Generate signed URLs for documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        try {
          const url = doc.file_path ? await ActivationService.getDocumentUrl(doc.file_path) : null;
          return { ...doc, url };
        } catch (error) {
          console.error(`Failed to generate URL for document ${doc.id}:`, error);
          return { ...doc, url: null };
        }
      })
    );

    return NextResponse.json({
      documents: documentsWithUrls
    });

  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}