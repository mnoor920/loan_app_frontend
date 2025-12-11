-- Simple loans table creation script for Supabase
-- Run this in your Supabase SQL Editor

-- Create the loans table
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_amount DECIMAL(12,2) NOT NULL CHECK (loan_amount > 0),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0 CHECK (interest_rate >= 0),
    monthly_payment DECIMAL(12,2) NOT NULL CHECK (monthly_payment > 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    status VARCHAR(50) DEFAULT 'Pending Approval' CHECK (status IN (
        'Pending Approval', 
        'Approved', 
        'In Repayment', 
        'Completed', 
        'Rejected'
    )),
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_date TIMESTAMP WITH TIME ZONE NULL,
    first_payment_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_application_date ON loans(application_date);
CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loans(user_id, status);

-- Verify the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;