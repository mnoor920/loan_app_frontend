// Database Error Handler for Activation Service
// Provides specific error handling for database operations

export class DatabaseErrorHandler {
  static handleActivationError(error: any): never {
    console.error('Database error details:', error);

    // PostgreSQL error codes
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint?.includes('user_activation_profiles_user_id_key')) {
        throw new Error('Activation profile already exists for this user');
      }
      throw new Error('Duplicate entry detected');
    }
    
    if (error.code === '23503') { // Foreign key violation
      if (error.constraint?.includes('user_id')) {
        throw new Error('Invalid user reference - user may not exist');
      }
      throw new Error('Invalid reference to related data');
    }
    
    if (error.code === '23514') { // Check constraint violation
      if (error.constraint?.includes('activation_status')) {
        throw new Error('Invalid activation status value');
      }
      if (error.constraint?.includes('validation_status')) {
        throw new Error('Invalid validation status value');
      }
      throw new Error('Data validation failed at database level');
    }

    if (error.code === '23502') { // Not null violation
      const column = error.column || 'unknown field';
      throw new Error(`Required field '${column}' cannot be empty`);
    }

    // Supabase specific errors
    if (error.code === 'PGRST116') { // No rows returned
      throw new Error('Activation profile not found');
    }

    if (error.code === 'PGRST301') { // Row level security violation
      throw new Error('Access denied - insufficient permissions');
    }

    // Connection and timeout errors
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      throw new Error('Database operation timed out. Please try again.');
    }

    if (error.message?.includes('connection') || error.code === 'ECONNREFUSED') {
      throw new Error('Database connection failed. Please check your internet connection.');
    }

    // Storage errors (for document uploads)
    if (error.message?.includes('storage')) {
      if (error.message.includes('not found')) {
        throw new Error('Storage bucket not found. Please contact support.');
      }
      if (error.message.includes('size')) {
        throw new Error('File size exceeds the allowed limit');
      }
      if (error.message.includes('type')) {
        throw new Error('File type not allowed');
      }
      throw new Error('File storage operation failed');
    }

    // Generic database error
    console.error('Unhandled database error:', error);
    throw new Error('Database operation failed. Please try again or contact support if the problem persists.');
  }

  static handleDocumentError(error: any): never {
    console.error('Document operation error:', error);

    // File size errors
    if (error.message?.includes('size') || error.code === 'FILE_TOO_LARGE') {
      throw new Error('File size exceeds the 10MB limit');
    }

    // File type errors
    if (error.message?.includes('type') || error.code === 'INVALID_FILE_TYPE') {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed');
    }

    // Storage quota errors
    if (error.message?.includes('quota') || error.code === 'STORAGE_QUOTA_EXCEEDED') {
      throw new Error('Storage quota exceeded. Please contact support.');
    }

    // Virus scan errors (if implemented)
    if (error.message?.includes('virus') || error.code === 'VIRUS_DETECTED') {
      throw new Error('File failed security scan. Please upload a different file.');
    }

    // Use generic database error handler for other cases
    return this.handleActivationError(error);
  }

  static handleValidationError(error: any): never {
    console.error('Validation error:', error);

    if (error.name === 'ValidationError') {
      throw error; // Re-throw validation errors as-is
    }

    // JSON parsing errors (for stored validation data)
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw new Error('Invalid data format detected. Please refresh and try again.');
    }

    // Type errors (usually from incorrect data types)
    if (error instanceof TypeError) {
      throw new Error('Invalid data type provided. Please check your input and try again.');
    }

    // Range errors (for dates, numbers, etc.)
    if (error instanceof RangeError) {
      throw new Error('Value out of acceptable range. Please check your input.');
    }

    // Generic validation error
    throw new Error('Data validation failed. Please check your input and try again.');
  }

  static handleAuditError(error: any): void {
    // Audit errors should not break the main flow
    console.error('Audit logging error (non-critical):', error);
    
    // Could implement fallback logging here (e.g., to local storage or external service)
    // For now, we just log and continue
  }

  static isRetryableError(error: any): boolean {
    // Determine if an error is worth retrying
    const retryableCodes = [
      'ETIMEDOUT',
      'ECONNREFUSED', 
      'ENOTFOUND',
      'ECONNRESET'
    ];

    const retryableMessages = [
      'timeout',
      'connection',
      'network',
      'temporary'
    ];

    if (retryableCodes.includes(error.code)) {
      return true;
    }

    if (error.message) {
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      );
    }

    return false;
  }

  static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    // Categorize error severity for monitoring/alerting
    
    // Critical errors that require immediate attention
    if (error.code === 'PGRST301' || error.message?.includes('security')) {
      return 'critical';
    }

    // High severity - data integrity issues
    if (error.code === '23505' || error.code === '23503' || error.code === '23514') {
      return 'high';
    }

    // Medium severity - operational issues
    if (this.isRetryableError(error)) {
      return 'medium';
    }

    // Low severity - user input issues
    if (error.name === 'ValidationError' || error.code === '23502') {
      return 'low';
    }

    return 'medium'; // Default
  }
}

// File Upload Error Handler
export class FileUploadErrorHandler {
  static validateFile(file: File, documentType: string): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    // Additional validation based on document type
    if (documentType === 'signature' && file.type !== 'image/png') {
      throw new Error('Signature must be in PNG format with transparent background');
    }

    // Check for minimum file size (avoid empty files)
    if (file.size < 1024) { // 1KB minimum
      throw new Error('File is too small. Please upload a valid image file');
    }

    // Basic filename validation
    if (file.name.length > 255) {
      throw new Error('Filename is too long. Please rename the file and try again');
    }

    // Check for potentially dangerous file extensions in the name
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs'];
    const fileName = file.name.toLowerCase();
    
    if (dangerousExtensions.some(ext => fileName.includes(ext))) {
      throw new Error('File name contains invalid characters or extensions');
    }
  }

  static handleUploadError(error: any, documentType: string): never {
    console.error(`Upload error for ${documentType}:`, error);

    // Use the database error handler for storage-related errors
    return DatabaseErrorHandler.handleDocumentError(error);
  }
}