-- Activation Audit Log Table
-- Execute this in Supabase SQL Editor to add audit logging capability

-- Create activation audit log table
CREATE TABLE IF NOT EXISTS activation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activation_profile_id UUID REFERENCES user_activation_profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'document_upload', 'status_change')),
  step_number INTEGER CHECK (step_number >= 1 AND step_number <= 6),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_user_id ON activation_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_profile_id ON activation_audit_log(activation_profile_id);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_action_type ON activation_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_created_at ON activation_audit_log(created_at);

-- Add validation constraints to existing user_activation_profiles table
ALTER TABLE user_activation_profiles 
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid'));

ALTER TABLE user_activation_profiles 
ADD COLUMN IF NOT EXISTS validation_errors JSONB;

ALTER TABLE user_activation_profiles 
ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE;

-- Add version tracking for data integrity
ALTER TABLE user_activation_profiles 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Function to automatically increment version on updates
CREATE OR REPLACE FUNCTION increment_activation_profile_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically increment version
DROP TRIGGER IF EXISTS increment_activation_profile_version_trigger ON user_activation_profiles;
CREATE TRIGGER increment_activation_profile_version_trigger
    BEFORE UPDATE ON user_activation_profiles
    FOR EACH ROW
    EXECUTE FUNCTION increment_activation_profile_version();

-- Enhanced user_documents table with additional metadata
ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS document_category VARCHAR(50) DEFAULT 'identity' CHECK (document_category IN ('identity', 'address', 'financial', 'signature'));

ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT TRUE;

ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed'));

ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS processing_error TEXT;

ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);

-- Create indexes for enhanced user_documents
CREATE INDEX IF NOT EXISTS idx_user_documents_category ON user_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_user_documents_processing_status ON user_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_user_documents_is_required ON user_documents(is_required);

-- Function to log activation changes automatically
CREATE OR REPLACE FUNCTION log_activation_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if this is an actual update (not insert)
  IF TG_OP = 'UPDATE' THEN
    -- Log significant field changes
    IF OLD.activation_status IS DISTINCT FROM NEW.activation_status THEN
      INSERT INTO activation_audit_log (
        user_id, activation_profile_id, action_type, field_name, old_value, new_value
      ) VALUES (
        NEW.user_id, NEW.id, 'status_change', 'activation_status', 
        OLD.activation_status, NEW.activation_status
      );
    END IF;
    
    IF OLD.current_step IS DISTINCT FROM NEW.current_step THEN
      INSERT INTO activation_audit_log (
        user_id, activation_profile_id, action_type, field_name, old_value, new_value
      ) VALUES (
        NEW.user_id, NEW.id, 'update', 'current_step', 
        OLD.current_step::TEXT, NEW.current_step::TEXT
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic audit logging
DROP TRIGGER IF EXISTS log_activation_profile_changes_trigger ON user_activation_profiles;
CREATE TRIGGER log_activation_profile_changes_trigger
    AFTER UPDATE ON user_activation_profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_activation_profile_changes();

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT ON activation_audit_log TO authenticated;
-- GRANT SELECT, UPDATE ON user_activation_profiles TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON user_documents TO authenticated;