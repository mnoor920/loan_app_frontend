import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string; documentId: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error!.message },
        { status: authResult.error!.status }
      );
    }

    const { userId, documentId } = params;
    const adminUser = authResult.admin!;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload JPEG, PNG, or PDF files only.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Check if document exists and belongs to the user
    const { data: existingDocuments, error: fetchError } = await supabase
      .from('user_documents')
      .select('id, file_path, document_type, user_id, original_filename')
      .eq('id', documentId)
      .eq('user_id', userId);

    if (fetchError || !existingDocuments || existingDocuments.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    const existingDocument = existingDocuments[0];
    const oldFilePath = existingDocument.file_path;

    // Generate new file path
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const newFileName = `${Date.now()}_${file.name}`;
    const uploadDir = join(process.cwd(), 'uploads', 'documents');
    const newFilePath = join(uploadDir, newFileName);
    const relativeFilePath = `uploads/documents/${newFileName}`;

    try {
      // Save new file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(newFilePath, buffer);

      // Update database record
      const { data: updatedDocuments, error: updateError } = await supabase
        .from('user_documents')
        .update({
          file_path: relativeFilePath,
          original_filename: file.name,
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', userId)
        .select('id, document_type, file_path, original_filename, verification_status, created_at, updated_at');

      if (updateError || !updatedDocuments || updatedDocuments.length === 0) {
        // If update failed, clean up the new file
        await unlink(newFilePath).catch(console.error);
        return NextResponse.json(
          { success: false, message: 'Failed to update document record' },
          { status: 500 }
        );
      }

      const updatedDocument = updatedDocuments[0];

      // Create admin modification log (if table exists)
      try {
        await supabase
          .from('admin_modification_log')
          .insert({
            admin_id: adminUser.id,
            admin_name: adminUser.name || adminUser.email,
            target_type: 'user_document',
            target_id: documentId,
            modification_type: 'document_replaced',
            old_value: JSON.stringify({ filename: existingDocument.original_filename, path: oldFilePath }),
            new_value: JSON.stringify({ filename: file.name, path: relativeFilePath }),
            reason: 'Document replaced by admin',
            user_notified: false
          });
      } catch (logError) {
        console.error('Failed to create admin log:', logError);
      }

      // Create user notification (if table exists)
      try {
        await supabase
          .from('user_notifications')
          .insert({
            user_id: userId,
            type: 'profile_updated',
            title: 'Document Updated',
            message: `Your ${getDocumentTypeLabel(existingDocument.document_type)} has been updated by our team.`,
            data: JSON.stringify({
              documentType: existingDocument.document_type,
              adminName: adminUser.name || adminUser.email,
              action: 'replaced'
            })
          });
      } catch (notificationError) {
        console.error('Failed to create user notification:', notificationError);
      }

      // Try to delete old file (don't fail if this doesn't work)
      if (oldFilePath) {
        const oldFileFullPath = join(process.cwd(), oldFilePath);
        await unlink(oldFileFullPath).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        message: 'Document replaced successfully',
        document: {
          id: updatedDocument.id,
          documentType: updatedDocument.document_type,
          filePath: updatedDocument.file_path,
          originalFilename: updatedDocument.original_filename,
          verificationStatus: updatedDocument.verification_status,
          createdAt: updatedDocument.created_at,
          updatedAt: updatedDocument.updated_at
        }
      });

    } catch (fileError) {
      console.error('File operation error:', fileError);
      return NextResponse.json(
        { success: false, message: 'Failed to save file' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Document replace error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'id_front': 'ID Front Side',
    'id_back': 'ID Back Side',
    'selfie': 'Selfie',
    'passport_photo': 'Passport Photo',
    'driver_license': 'Driver License'
  };
  return labels[type] || type;
}