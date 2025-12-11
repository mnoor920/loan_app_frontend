-- Quick Fix for Loan Application Tables
-- Execute this in your Supabase SQL Editor to fix the 500 error

-- First, let's check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%loan%';

-- Create the main loan_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Application Details
  application_number VARCHAR(50) UNIQUE,
  
  -- Loan Information
  loan_amount DECIMAL(12,2) NOT NULL CHECK (loan_amount > 0),
  duration_months INTEGER NOT NULL CHECK (duration_months > 0 AND duration_months <= 360),
  interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 100),
  monthly_payment DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  loan_purpose TEXT,
  
  -- Status and Dates
  status VARCHAR(20) DEFAULT 'Pending Approval' CHECK (status IN ('Pending Approval', 'Approved', 'In Repayment', 'Completed', 'Rejected')),
  application_date DATE DEFAULT CURRENT_DATE,
  approval_date DATE,
  first_payment_date DATE,
  
  -- Admin Notes
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at ON loan_applications(created_at);

-- Create admin modifications table for audit trail
CREATE TABLE IF NOT EXISTS admin_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_name VARCHAR(255) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  modification_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_loan_applications_updated_at ON loan_applications;
CREATE TRIGGER update_loan_applications_updated_at
    BEFORE UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log admin modifications and create user notifications
CREATE OR REPLACE FUNCTION log_admin_modification(
  p_admin_id UUID,
  p_admin_name VARCHAR,
  p_target_type VARCHAR,
  p_target_id UUID,
  p_modification_type VARCHAR,
  p_old_value JSONB,
  p_new_value JSONB,
  p_reason TEXT,
  p_user_id UUID DEFAULT NULL,
  p_notification_title VARCHAR DEFAULT NULL,
  p_notification_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  modification_id UUID;
BEGIN
  -- Insert admin modification log
  INSERT INTO admin_modifications (
    admin_id, admin_name, target_type, target_id, 
    modification_type, old_value, new_value, reason
  ) VALUES (
    p_admin_id, p_admin_name, p_target_type, p_target_id,
    p_modification_type, p_old_value, p_new_value, p_reason
  ) RETURNING id INTO modification_id;
  
  -- Create user notification if specified
  IF p_user_id IS NOT NULL AND p_notification_title IS NOT NULL THEN
    INSERT INTO user_notifications (user_id, title, message, type)
    VALUES (p_user_id, p_notification_title, p_notification_message, 'loan_update');
  END IF;
  
  RETURN modification_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some test data if the table is empty (optional)
INSERT INTO loan_applications (
  user_id, 
  loan_amount, 
  duration_months, 
  interest_rate, 
  loan_purpose,
  status
) 
SELECT 
  '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID,
  25000.00,
  36,
  5.5,
  'Home improvement',
  'Pending Approval'
WHERE NOT EXISTS (
  SELECT 1 FROM loan_applications 
  WHERE id = '64b9e282-8ec6-4005-bddb-fb74e3de7e61'::UUID
);

-- Verify the setup
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('loan_applications', 'admin_modifications', 'user_notifications');

-- Check if we have any loan applications
SELECT COUNT(*) as loan_count FROM loan_applications;