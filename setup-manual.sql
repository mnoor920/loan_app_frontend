-- Manual Database Setup for Activation Data Storage
-- Execute this file in your Supabase SQL Editor
-- 
-- Instructions:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute all statements

-- User Activation Profile Table (Enhanced)
CREATE TABLE IF NOT EXISTS user_activation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Step 1: Personal Information
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  full_name VARCHAR(255) CHECK (LENGTH(TRIM(full_name)) >= 2),
  date_of_birth DATE CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years'),
  marital_status VARCHAR(50) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  nationality VARCHAR(100) CHECK (LENGTH(TRIM(nationality)) >= 2),
  agreed_to_terms BOOLEAN DEFAULT FALSE,
  
  -- Step 2: Family/Relatives (stored as JSONB for flexibility)
  family_relatives JSONB,
  
  -- Step 3: Address Information
  residing_country VARCHAR(100) CHECK (LENGTH(TRIM(residing_country)) >= 2),
  state_region_province VARCHAR(100),
  town_city VARCHAR(100) CHECK (LENGTH(TRIM(town_city)) >= 2),
  
  -- Step 4: ID Information
  id_type VARCHAR(20) DEFAULT 'NIC' CHECK (id_type IN ('NIC', 'passport', 'driver_license')),
  id_number VARCHAR(50) CHECK (LENGTH(TRIM(id_number)) >= 5),
  
  -- Step 5: Bank Information
  account_type VARCHAR(20) CHECK (account_type IN ('bank', 'ewallet')),
  bank_name VARCHAR(100),
  account_number VARCHAR(50) CHECK (LENGTH(TRIM(account_number)) >= 5),
  account_holder_name VARCHAR(255) CHECK (LENGTH(TRIM(account_holder_name)) >= 2),
  
  -- Step 6: Signature
  signature_data TEXT, -- Base64 encoded signature
  
  -- Activation Status
  activation_status VARCHAR(20) DEFAULT 'pending' CHECK (activation_status IN ('pending', 'in_progress', 'completed', 'rejected')),
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Enhanced Validation and Audit Fields
  validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors JSONB DEFAULT '{}',
  last_validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit metadata
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  version INTEGER DEFAULT 1,
  
  -- Progress tracking
  steps_completed INTEGER[] DEFAULT '{}',
  estimated_completion_time TIMESTAMP WITH TIME ZONE,
  
  -- Security
  data_hash VARCHAR(64), -- SHA-256 hash for integrity verification
  encrypted_fields TEXT[] DEFAULT '{}', -- List of encrypted field names
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id), -- One activation profile per user
  CHECK (completed_at IS NULL OR activation_status = 'completed'),
  CHECK (validation_errors IS NULL OR jsonb_typeof(validation_errors) = 'object')
);

-- User Document Attachments Table (Enhanced)
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activation_profile_id UUID REFERENCES user_activation_profiles(id) ON DELETE CASCADE,
  
  -- Document Information
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_front', 'id_back', 'selfie', 'passport_photo', 'driver_license')),
  original_filename VARCHAR(255) CHECK (LENGTH(TRIM(original_filename)) > 0),
  file_path VARCHAR(500) CHECK (LENGTH(TRIM(file_path)) > 0), -- Path to stored file
  file_size INTEGER CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
  mime_type VARCHAR(100) CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  
  -- Enhanced metadata
  document_category VARCHAR(20) DEFAULT 'identity' CHECK (document_category IN ('identity', 'address', 'financial', 'signature')),
  is_required BOOLEAN DEFAULT TRUE,
  validation_rules JSONB DEFAULT '{}',
  
  -- Processing status
  processing_status VARCHAR(20) DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed')),
  processing_error TEXT,
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Security
  file_hash VARCHAR(64), -- SHA-256 hash for file integrity
  encryption_status VARCHAR(20) DEFAULT 'none' CHECK (encryption_status IN ('none', 'encrypted')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (verification_status != 'approved' OR verified_by IS NOT NULL),
  CHECK (verification_status != 'approved' OR verified_at IS NOT NULL),
  CHECK (processing_status != 'failed' OR processing_error IS NOT NULL)
);

-- Activation Audit Log Table (New)
CREATE TABLE IF NOT EXISTS activation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activation_profile_id UUID REFERENCES user_activation_profiles(id) ON DELETE CASCADE,
  
  -- Action Information
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'document_upload', 'status_change', 'validation')),
  step_number INTEGER CHECK (step_number >= 1 AND step_number <= 6),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Additional Metadata
  metadata JSONB DEFAULT '{}',
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
);

-- Document Access Log Table (New)
CREATE TABLE IF NOT EXISTS document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Access Information
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'upload', 'delete')),
  ip_address INET,
  user_agent TEXT,
  
  -- Result
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (success = TRUE OR error_message IS NOT NULL)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_user_id ON user_activation_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_status ON user_activation_profiles(activation_status);
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_validation_status ON user_activation_profiles(validation_status);
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_current_step ON user_activation_profiles(current_step);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_activation_profile_id ON user_documents(activation_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_verification_status ON user_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_documents_processing_status ON user_documents(processing_status);

CREATE INDEX IF NOT EXISTS idx_activation_audit_log_user_id ON activation_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_action_type ON activation_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_created_at ON activation_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_profile_id ON activation_audit_log(activation_profile_id);

CREATE INDEX IF NOT EXISTS idx_document_access_log_document_id ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user_id ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_created_at ON document_access_log(created_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_activation_profiles_updated_at 
    BEFORE UPDATE ON user_activation_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at 
    BEFORE UPDATE ON user_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment version number on updates
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate data hash for integrity verification
CREATE OR REPLACE FUNCTION calculate_data_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_hash = encode(
        digest(
            CONCAT(
                COALESCE(NEW.full_name, ''),
                COALESCE(NEW.date_of_birth::text, ''),
                COALESCE(NEW.id_number, ''),
                COALESCE(NEW.account_number, '')
            ), 
            'sha256'
        ), 
        'hex'
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update steps_completed array
CREATE OR REPLACE FUNCTION update_steps_completed()
RETURNS TRIGGER AS $$
BEGIN
    -- Update steps_completed based on current_step
    IF NEW.current_step IS NOT NULL AND NEW.current_step > COALESCE(OLD.current_step, 0) THEN
        NEW.steps_completed = array_append(
            COALESCE(NEW.steps_completed, '{}'), 
            NEW.current_step - 1
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to log activation changes
CREATE OR REPLACE FUNCTION log_activation_changes()
RETURNS TRIGGER AS $$
DECLARE
    action_type_val VARCHAR(50);
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type_val = 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        action_type_val = 'update';
    ELSIF TG_OP = 'DELETE' THEN
        action_type_val = 'delete';
    END IF;

    -- Log the change
    INSERT INTO activation_audit_log (
        user_id,
        activation_profile_id,
        action_type,
        step_number,
        old_value,
        new_value,
        created_at
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        COALESCE(NEW.id, OLD.id),
        action_type_val,
        COALESCE(NEW.current_step, OLD.current_step),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::text ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::text ELSE NULL END,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Enhanced Triggers for user_activation_profiles
CREATE TRIGGER increment_user_activation_profiles_version 
    BEFORE UPDATE ON user_activation_profiles 
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER calculate_user_activation_profiles_hash 
    BEFORE INSERT OR UPDATE ON user_activation_profiles 
    FOR EACH ROW EXECUTE FUNCTION calculate_data_hash();

CREATE TRIGGER update_user_activation_profiles_steps 
    BEFORE UPDATE ON user_activation_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_steps_completed();

CREATE TRIGGER log_user_activation_profiles_changes 
    AFTER INSERT OR UPDATE OR DELETE ON user_activation_profiles 
    FOR EACH ROW EXECUTE FUNCTION log_activation_changes();

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
    p_document_id UUID,
    p_user_id UUID,
    p_access_type VARCHAR(20),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO document_access_log (
        document_id,
        user_id,
        access_type,
        ip_address,
        user_agent,
        success,
        error_message
    ) VALUES (
        p_document_id,
        p_user_id,
        p_access_type,
        p_ip_address,
        p_user_agent,
        p_success,
        p_error_message
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ language 'plpgsql';

-- Verification Queries (run these after setup to verify)
-- Check if tables were created:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_activation_profiles', 'user_documents', 'activation_audit_log', 'document_access_log');

-- Check if functions were created:
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN ('update_updated_at_column', 'increment_version', 'calculate_data_hash', 'log_document_access');

-- Check if triggers were created:
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public';