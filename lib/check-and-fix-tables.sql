-- Check and Fix Tables Script
-- Run this to see what tables exist and create missing ones

-- First, let's see what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%loan%';

-- If loan_applications table doesn't exist, create it
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_number VARCHAR(50),
  loan_amount DECIMAL(12,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  monthly_payment DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  loan_purpose TEXT,
  status VARCHAR(20) DEFAULT 'Pending Approval',
  application_date DATE DEFAULT CURRENT_DATE,
  approval_date DATE,
  first_payment_date DATE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);

-- Check if we have any data in loans table that needs to be migrated
SELECT COUNT(*) as loans_count FROM loans WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loans');

-- Check if we have any data in loan_applications table
SELECT COUNT(*) as loan_applications_count FROM loan_applications;