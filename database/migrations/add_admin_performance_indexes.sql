-- Performance optimization indexes for admin dashboard queries
-- This migration adds indexes to improve query performance for admin operations

-- Indexes for user_activation_profiles table
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_status 
ON user_activation_profiles(activation_status);

CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_completed_at 
ON user_activation_profiles(completed_at DESC) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_user_id 
ON user_activation_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_search 
ON user_activation_profiles(full_name, activation_status);

-- Indexes for users table for admin queries
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_created_at 
ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_email_search 
ON users(email, first_name, last_name);

-- Indexes for loans table
CREATE INDEX IF NOT EXISTS idx_loans_status 
ON loans(status);

CREATE INDEX IF NOT EXISTS idx_loans_application_date 
ON loans(application_date DESC);

CREATE INDEX IF NOT EXISTS idx_loans_user_id 
ON loans(user_id);

CREATE INDEX IF NOT EXISTS idx_loans_amount 
ON loans(loan_amount);

CREATE INDEX IF NOT EXISTS idx_loans_admin_search 
ON loans(status, application_date DESC, loan_amount);

-- Composite index for loan list queries with user info
CREATE INDEX IF NOT EXISTS idx_loans_with_user_info 
ON loans(status, application_date DESC, user_id);

-- Indexes for user_notifications table
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id 
ON user_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_read_status 
ON user_notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_type 
ON user_notifications(type, created_at DESC);

-- Indexes for admin_modification_log table
CREATE INDEX IF NOT EXISTS idx_admin_modification_log_admin_id 
ON admin_modification_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_modification_log_target 
ON admin_modification_log(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_modification_log_modified_at 
ON admin_modification_log(modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_modification_log_user_notified 
ON admin_modification_log(user_notified, modified_at DESC);

-- Indexes for user_documents table
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id 
ON user_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_user_documents_type 
ON user_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_user_documents_verification_status 
ON user_documents(verification_status);

-- Partial indexes for better performance on specific queries
CREATE INDEX IF NOT EXISTS idx_loans_pending_approval 
ON loans(application_date DESC, user_id) 
WHERE status = 'Pending Approval';

CREATE INDEX IF NOT EXISTS idx_loans_approved 
ON loans(approval_date DESC, user_id) 
WHERE status = 'Approved';

CREATE INDEX IF NOT EXISTS idx_user_activation_completed 
ON user_activation_profiles(completed_at DESC, user_id) 
WHERE activation_status = 'completed';

-- Index for full-text search on user names (if using PostgreSQL)
-- CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_fulltext 
-- ON user_activation_profiles USING gin(to_tsvector('english', full_name));

-- Index for full-text search on user emails (if using PostgreSQL)
-- CREATE INDEX IF NOT EXISTS idx_users_email_fulltext 
-- ON users USING gin(to_tsvector('english', email || ' ' || first_name || ' ' || last_name));

-- Statistics update for better query planning
ANALYZE user_activation_profiles;
ANALYZE users;
ANALYZE loans;
ANALYZE user_notifications;
ANALYZE admin_modification_log;
ANALYZE user_documents;