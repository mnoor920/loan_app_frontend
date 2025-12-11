-- Complete Activation Database Schema
-- Execute this in Supabase SQL Editor to fix activation data storage

-- Drop existing table if it exists (be careful in production!)
-- DROP TABLE IF EXISTS user_activation_profiles CASCADE;

-- Create comprehensive user_activation_profiles table
CREATE TABLE IF NOT EXISTS user_activation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Step 1: Personal Information
  gender VARCHAR(10),
  full_name VARCHAR(255),
  date_of_birth DATE,
  marital_status VARCHAR(50),
  nationality VARCHAR(100),
  agreed_to_terms BOOLEAN DEFAULT FALSE,
  
  -- Step 2: Family Relatives
  family_relatives JSONB,
  
  -- Step 3: Address Information
  residing_country VARCHAR(100),
  state_region_province VARCHAR(100),
  town_city VARCHAR(100),
  
  -- Step 4: ID Information
  id_type VARCHAR(50),
  id_number VARCHAR(100),
  
  -- Step 5: Bank Information
  account_type VARCHAR(20),
  bank_name VARCHAR(100),
  account_number VARCHAR(100),
  account_holder_name VARCHAR(255),
  
  -- Step 6: Signature
  signature_data TEXT,
  
  -- Status and Progress
  activation_status VARCHAR(20) DEFAULT 'pending' CHECK (activation_status IN ('pending', 'in_progress', 'completed', 'rejected')),
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Validation fields
  validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors JSONB,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Version tracking
  version INTEGER DEFAULT 1,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Create user_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activation_profile_id UUID REFERENCES user_activation_profiles(id) ON DELETE SET NULL,
  
  -- Document information
  document_type VARCHAR(50) NOT NULL,
  document_category VARCHAR(50) DEFAULT 'identity' CHECK (document_category IN ('identity', 'address', 'financial', 'signature')),
  original_filename VARCHAR(255),
  file_path VARCHAR(500),
  file_size INTEGER,
  mime_type VARCHAR(100),
  file_hash VARCHAR(64),
  
  -- Verification status
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Processing status
  processing_status VARCHAR(20) DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed')),
  processing_error TEXT,
  
  -- Requirements
  is_required BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_user_id ON user_activation_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_status ON user_activation_profiles(activation_status);
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_step ON user_activation_profiles(current_step);
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_validation ON user_activation_profiles(validation_status);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_profile_id ON user_documents(activation_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_category ON user_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_user_documents_verification ON user_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_documents_processing ON user_documents(processing_status);

CREATE INDEX IF NOT EXISTS idx_activation_audit_log_user_id ON activation_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_profile_id ON activation_audit_log(activation_profile_id);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_action_type ON activation_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_created_at ON activation_audit_log(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to automatically increment version on updates
CREATE OR REPLACE FUNCTION increment_activation_profile_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp and version updates
DROP TRIGGER IF EXISTS update_user_activation_profiles_updated_at ON user_activation_profiles;
CREATE TRIGGER update_user_activation_profiles_updated_at
    BEFORE UPDATE ON user_activation_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS increment_activation_profile_version_trigger ON user_activation_profiles;
CREATE TRIGGER increment_activation_profile_version_trigger
    BEFORE UPDATE ON user_activation_profiles
    FOR EACH ROW
    EXECUTE FUNCTION increment_activation_profile_version();

DROP TRIGGER IF EXISTS update_user_documents_updated_at ON user_documents;
CREATE TRIGGER update_user_documents_updated_at
    BEFORE UPDATE ON user_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
-- GRANT SELECT, INSERT, UPDATE ON user_activation_profiles TO authenticated;
-- GRANT SELECT, INSERT ON activation_audit_log TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON user_documents TO authenticated;

-- Insert test data to verify the schema works (optional - remove in production)
/*
-- Test with existing user
INSERT INTO user_activation_profiles (
  user_id, 
  full_name, 
  gender, 
  date_of_birth, 
  nationality, 
  agreed_to_terms,
  activation_status,
  current_step
) 
SELECT 
  id,
  'Test User',
  'male',
  '1990-01-01',
  'Pakistani',
  true,
  'in_progress',
  1
FROM users 
WHERE email = 'test@example.com'
ON CONFLICT (user_id) DO NOTHING;
*/