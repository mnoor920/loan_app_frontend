// Simple file storage that saves files as base64 in database
// This is a fallback if Supabase Storage has issues

import { supabase } from './supabase';

export interface SimpleDocument {
  id: string;
  user_id: string;
  document_type: string;
  original_filename: string;
  file_data: string; // base64 encoded file
  file_size: number;
  mime_type: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export class SimpleFileStorage {

  // Convert file to base64 (server-side)
  static async fileToBase64(file: File): Promise<string> {
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(arrayBuffer);

      // Convert to base64 data URL
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      return dataUrl;
    } catch (error) {
      console.error('Error converting file to base64:', error);
      throw error;
    }
  }

  // Save document with base64 data
  static async saveDocument(
    userId: string,
    file: File,
    documentType: string,
    activationProfileId?: string
  ): Promise<SimpleDocument> {
    try {
      console.log(`📁 Saving document: ${documentType} for user ${userId}`);

      // Convert file to base64
      const fileData = await this.fileToBase64(file);

      // Save to database
      const { data, error } = await supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          activation_profile_id: activationProfileId,
          document_type: documentType,
          original_filename: file.name,
          file_path: `base64:${documentType}`, // Indicate this is base64 stored
          file_size: file.size,
          mime_type: file.type,
          verification_status: 'pending',
          metadata: {
            file_data: fileData
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save document: ${error.message}`);
      }

      console.log('✅ Document saved successfully');
      return data as SimpleDocument;
    } catch (error) {
      console.error('❌ Error saving document:', error);
      throw error;
    }
  }

  // Get document data (returns base64 data URL)
  static async getDocumentData(documentId: string, userId: string): Promise<string> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), 5000); // 5 second timeout
      });

      const queryPromise = supabase
        .from('user_documents')
        .select('metadata')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Database error getting document:', error);
        throw new Error(`Failed to get document: ${error.message}`);
      }

      if (data?.metadata?.file_data) {
        return data.metadata.file_data;
      }

      throw new Error('Document data not found');
    } catch (error: any) {
      console.error('❌ Error getting document:', error);
      if (error.message?.includes('timeout') || error.message?.includes('terminated')) {
        throw new Error('Document loading timed out. Please try again.');
      }
      throw error;
    }
  }

  // Get all user documents
  static async getUserDocuments(userId: string): Promise<SimpleDocument[]> {
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get documents: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting documents:', error);
      throw error;
    }
  }
}