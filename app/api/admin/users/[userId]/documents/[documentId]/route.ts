import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAuth, createAdminErrorResponse, createAdminSuccessResponse, getAdminFromRequest } from '@/lib/admin-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; documentId: string } }
) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    // Get admin info
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return createAdminErrorResponse(401, 'Admin authentication failed.');
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      return createAdminErrorResponse(503, 'Admin service not available. Please contact system administrator.');
    }

    const { userId, documentId } = params;

    if (!userId || !documentId) {
      return createAdminErrorResponse(400, 'User ID and Document ID are required.');
    }

    try {
      // First, verify the document exists and belongs to the user
      const { data: documentData, error: documentError } = await supabaseAdmin
        .from('user_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (documentError) {
        if (documentError.code === 'PGRST116') {
          return createAdminErrorResponse(404, 'Document not found or does not belong to the specified user.');
        }
        console.error('Error fetching document:', documentError);
        throw new Error(`Failed to fetch document: ${documentError.message}`);
      }

      // Delete the document record
      const { error: deleteError } = await supabaseAdmin
        .from('user_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting document:', deleteError);
        throw new Error(`Failed to delete document: ${deleteError.message}`);
      }

      // Log the document access/deletion
      const { error: logError } = await supabaseAdmin
        .rpc('log_document_access', {
          p_document_id: documentId,
          p_user_id: admin.id,
          p_access_type: 'delete',
          p_success: true
        });

      if (logError) {
        console.error('Error logging document access:', logError);
        // Don't fail the request if logging fails
      }

      // Create admin modification log
      const { error: modLogError } = await supabaseAdmin
        .rpc('log_admin_modification', {
          p_admin_id: admin.id,
          p_admin_name: admin.name || 'Admin',
          p_target_type: 'user_profile',
          p_target_id: userId,
          p_modification_type: 'profile_update',
          p_old_value: { document: documentData },
          p_new_value: { document: null },
          p_reason: 'Document removed by admin',
          p_user_id: userId,
          p_notification_title: 'Document Updated',
          p_notification_message: `A document (${documentData.document_type}) has been removed from your profile by our admin team.`
        });

      if (modLogError) {
        console.error('Error creating admin modification log:', modLogError);
        // Don't fail the request if logging fails
      }

      return createAdminSuccessResponse(
        {
          deletedDocument: {
            id: documentData.id,
            documentType: documentData.document_type,
            originalFilename: documentData.original_filename
          },
          notification: {
            sent: !modLogError,
            type: 'profile_updated'
          }
        },
        'Document removed successfully.'
      );

    } catch (dbError: any) {
      console.error('Database error during document deletion:', dbError);

      // Handle specific database errors
      if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return createAdminErrorResponse(503, 'Document system not found. Please ensure the database is properly set up.');
      }

      if (dbError.message.includes('connection') || dbError.message.includes('timeout')) {
        return createAdminErrorResponse(503, 'Database connection issue. Please try again in a few moments.');
      }

      // Generic database error
      return createAdminErrorResponse(500, 'Failed to remove document. Please try again later.');
    }

  } catch (error: any) {
    console.error('Admin document deletion error:', error);
    return createAdminErrorResponse(500, 'An unexpected error occurred. Please try again later.');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; documentId: string } }
) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    // Get admin info
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return createAdminErrorResponse(401, 'Admin authentication failed.');
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      return createAdminErrorResponse(503, 'Admin service not available. Please contact system administrator.');
    }

    const { userId, documentId } = params;

    if (!userId || !documentId) {
      return createAdminErrorResponse(400, 'User ID and Document ID are required.');
    }

    try {
      // Fetch document details
      const { data: documentData, error: documentError } = await supabaseAdmin
        .from('user_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (documentError) {
        if (documentError.code === 'PGRST116') {
          return createAdminErrorResponse(404, 'Document not found or does not belong to the specified user.');
        }
        console.error('Error fetching document:', documentError);
        throw new Error(`Failed to fetch document: ${documentError.message}`);
      }

      // Log the document access
      const { error: logError } = await supabaseAdmin
        .rpc('log_document_access', {
          p_document_id: documentId,
          p_user_id: admin.id,
          p_access_type: 'view',
          p_success: true
        });

      if (logError) {
        console.error('Error logging document access:', logError);
        // Don't fail the request if logging fails
      }

      return createAdminSuccessResponse(
        {
          document: {
            id: documentData.id,
            documentType: documentData.document_type,
            filePath: documentData.file_path,
            originalFilename: documentData.original_filename,
            fileSize: documentData.file_size,
            mimeType: documentData.mime_type,
            verificationStatus: documentData.verification_status,
            verificationNotes: documentData.verification_notes,
            createdAt: documentData.created_at,
            updatedAt: documentData.updated_at
          }
        },
        'Document details retrieved successfully.'
      );

    } catch (dbError: any) {
      console.error('Database error during document retrieval:', dbError);

      // Handle specific database errors
      if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return createAdminErrorResponse(503, 'Document system not found. Please ensure the database is properly set up.');
      }

      if (dbError.message.includes('connection') || dbError.message.includes('timeout')) {
        return createAdminErrorResponse(503, 'Database connection issue. Please try again in a few moments.');
      }

      // Generic database error
      return createAdminErrorResponse(500, 'Failed to retrieve document. Please try again later.');
    }

  } catch (error: any) {
    console.error('Admin document retrieval error:', error);
    return createAdminErrorResponse(500, 'An unexpected error occurred. Please try again later.');
  }
}