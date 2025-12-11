-- Comprehensive Database Schema for Loan Approval System
-- Execute this in Supabase SQL Editor to fix loan approval functionality

-- Ensure users table exists (reference table)
-- This should already exist, but we'll make sure it has the right structure
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main loan applications table (standardized)
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
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

-- Create sequence for application numbers
CREATE SEQUENCE IF NOT EXISTS loan_app_seq START 1;

-- Function to generate application numbers
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'LA-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(NEXTVAL('loan_app_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate application numbers
CREATE OR REPLACE FUNCTION set_application_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_number IS NULL THEN
    NEW.application_number := generate_application_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_application_number_trigger ON loan_applications;
CREATE TRIGGER set_application_number_trigger
    BEFORE INSERT ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION set_application_number();

-- Admin modifications audit table
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

-- User notifications table for loan status changes
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_application_date ON loan_applications(application_date);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at ON loan_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_modifications_target ON admin_modifications(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_modifications_admin ON admin_modifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_modifications_created_at ON admin_modifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_loan_applications_updated_at ON loan_applications;
CREATE TRIGGER update_loan_applications_updated_at
    BEFORE UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate monthly payment and total amount
CREATE OR REPLACE FUNCTION calculate_loan_payments(
  p_loan_amount DECIMAL,
  p_duration_months INTEGER,
  p_interest_rate DECIMAL
) RETURNS TABLE(monthly_payment DECIMAL, total_amount DECIMAL) AS $$
DECLARE
  monthly_rate DECIMAL;
  payment DECIMAL;
  total DECIMAL;
BEGIN
  -- Convert annual interest rate to monthly rate
  monthly_rate := p_interest_rate / 100 / 12;
  
  -- Calculate monthly payment using loan payment formula
  IF monthly_rate > 0 THEN
    payment := p_loan_amount * (monthly_rate * POWER(1 + monthly_rate, p_duration_months)) / 
               (POWER(1 + monthly_rate, p_duration_months) - 1);
  ELSE
    -- If no interest, just divide principal by months
    payment := p_loan_amount / p_duration_months;
  END IF;
  
  total := payment * p_duration_months;
  
  RETURN QUERY SELECT ROUND(payment, 2), ROUND(total, 2);
END;
$$ LANGUAGE plpgsql;

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

-- Trigger to automatically calculate loan payments when loan data changes
CREATE OR REPLACE FUNCTION update_loan_calculations()
RETURNS TRIGGER AS $$
DECLARE
  payment_data RECORD;
BEGIN
  -- Calculate monthly payment and total amount
  SELECT * INTO payment_data 
  FROM calculate_loan_payments(NEW.loan_amount, NEW.duration_months, NEW.interest_rate);
  
  NEW.monthly_payment := payment_data.monthly_payment;
  NEW.total_amount := payment_data.total_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_loan_payments_trigger ON loan_applications;
CREATE TRIGGER calculate_loan_payments_trigger
    BEFORE INSERT OR UPDATE OF loan_amount, duration_months, interest_rate ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_calculations();

-- Create a view for easy loan application queries with user data
CREATE OR REPLACE VIEW loan_applications_with_users AS
SELECT 
  la.*,
  u.email,
  u.first_name,
  u.last_name,
  u.phone_number,
  uap.full_name,
  uap.activation_status,
  uap.current_step,
  uap.completed_at as profile_completed_at
FROM loan_applications la
JOIN users u ON la.user_id = u.id
LEFT JOIN user_activation_profiles uap ON u.id = uap.user_id;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON loan_applications TO authenticated;
-- GRANT SELECT, INSERT ON admin_modifications TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON user_notifications TO authenticated;
-- GRANT USAGE ON SEQUENCE loan_app_seq TO authenticated;

-- Insert some sample data for testing (optional - remove in production)
-- This helps verify the schema works correctly
/*
INSERT INTO users (email, first_name, last_name, phone_number) VALUES 
('john.doe@example.com', 'John', 'Doe', '+1234567890'),
('jane.smith@example.com', 'Jane', 'Smith', '+1234567891')
ON CONFLICT (email) DO NOTHING;

INSERT INTO loan_applications (user_id, loan_amount, duration_months, interest_rate, loan_purpose)
SELECT 
  u.id,
  25000.00,
  36,
  5.5,
  'Home improvement'
FROM users u 
WHERE u.email = 'john.doe@example.com'
ON CONFLICT DO NOTHING;
*/