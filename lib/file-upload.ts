export interface UploadResult {
  success: boolean;
  document?: any;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class FileUploadService {
  static async uploadDocument(
    file: File,
    documentType: string,
    activationProfileId?: string
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (activationProfileId) {
        formData.append('activationProfileId', activationProfileId);
      }

      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to upload document'
        };
      }

      return {
        success: true,
        document: data.document
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: 'Network error occurred while uploading'
      };
    }
  }

  static async getUserDocuments() {
    try {
      const response = await fetch(`${API_URL}/api/activation/documents`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Get documents error:', error);
      return [];
    }
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 5MB.'
      };
    }

    return { valid: true };
  }
}