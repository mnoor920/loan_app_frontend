-- Performance optimization indexes for profile-related queries
-- These indexes will significantly improve query performance for the batch profile endpoint

-- Index for user_activation_profiles table
-- Primary lookup by user_id (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_user_id 
ON user_activation_profiles(user_id);

-- Composite index for user_id and activation_status for quick status checks
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_user_status 
ON user_activation_profiles(user_id, activation_status);

-- Index for user_documents table
-- Primary lookup by user_id (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
ON user_documents(user_id);

-- Composite index for user_id and document_type for quick document type filtering
CREATE INDEX IF NOT EXISTS idx_user_documents_user_type 
ON user_documents(user_id, document_type);

-- Composite index for user_id and verification_status for quick status filtering
CREATE INDEX IF NOT EXISTS idx_user_documents_user_verification 
ON user_documents(user_id, verification_status);

-- Index for created_at to optimize ordering by date
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at 
ON user_documents(created_at DESC);

-- Composite index for user_id and created_at for optimal sorting performance
CREATE INDEX IF NOT EXISTS idx_user_documents_user_created 
ON user_documents(user_id, created_at DESC);

-- Add partial indexes for common status values to save space and improve performance
CREATE INDEX IF NOT EXISTS idx_user_documents_pending 
ON user_documents(user_id) 
WHERE verification_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_user_documents_verified 
ON user_documents(user_id) 
WHERE verification_status = 'verified';

-- Index for activation profiles by current_step for progress calculations
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_step 
ON user_activation_profiles(user_id, current_step);

-- Analyze tables to update statistics for query planner
ANALYZE user_activation_profiles;
ANALYZE user_documents;