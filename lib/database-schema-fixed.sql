-- Enhanced Database Schema for Activation Data Storage
-- Execute this in Supabase SQL Editor

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
  signature_data TEXT,
  
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
  data_hash VARCHAR(64),
  encrypted_fields TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  CHECK (completed_at IS NULL OR activation_status = 'completed'),
  CHECK (validation_errors IS NULL OR jsonb_typeof(validation_errors) = 'object')
);

-- User Document Attachments Table (Enhanced)
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activation_profile_id UUID REFERENCES user_activation_profiles(id) ON DELETE CASCADE,
  
  -- Document Information
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_front', 'id_back', 'selfie', 'passport_photo', 'driver_license', 'electricity_bill')),
  original_filename VARCHAR(255) CHECK (LENGTH(TRIM(original_filename)) > 0),
  file_path VARCHAR(500) CHECK (LENGTH(TRIM(file_path)) > 0),
  file_size INTEGER CHECK (file_size > 0 AND file_size <= 10485760),
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
  file_hash VARCHAR(64),
  encryption_status VARCHAR(20) DEFAULT 'none' CHECK (encryption_status IN ('none', 'encrypted')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (verification_status != 'approved' OR verified_by IS NOT NULL),
  CHECK (verification_status != 'approved' OR verified_at IS NOT NULL),
  CHECK (processing_status != 'failed' OR processing_error IS NOT NULL)
);

-- Activation Audit Log Table
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

-- Document Access Log Table
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

-- User Notifications Table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('loan_status_changed', 'loan_details_modified', 'profile_updated')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CHECK (data IS NULL OR jsonb_typeof(data) = 'object')
);

-- Admin Modification Log Table
CREATE TABLE IF NOT EXISTS admin_modification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  admin_name VARCHAR(255) NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('loan', 'user_profile')),
  target_id UUID NOT NULL,
  modification_type VARCHAR(50) NOT NULL CHECK (modification_type IN ('status_change', 'loan_details', 'profile_update')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_notified BOOLEAN DEFAULT FALSE,
  notification_id UUID REFERENCES user_notifications(id),
  
  -- Constraints
  CHECK (old_value IS NULL OR jsonb_typeof(old_value) = 'object'),
  CHECK (new_value IS NULL OR jsonb_typeof(new_value) = 'object')
);

-- Indexes for Performance
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

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_modification_log_admin_id ON admin_modification_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_modification_log_target_type ON admin_modification_log(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_modification_log_target_id ON admin_modification_log(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_modification_log_modified_at ON admin_modification_log(modified_at);
CREATE INDEX IF NOT EXISTS idx_admin_modification_log_notification_id ON admin_modification_log(notification_id);