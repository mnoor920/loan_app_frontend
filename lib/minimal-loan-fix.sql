-- Minimal Loan Fix - Just create the essential table
-- Execute this in Supabase SQL Editor

-- Create the loan_applications table (the main table we need)
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

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);