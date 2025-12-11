-- Create the loans table for storing loan applications
-- This table stores all loan application data with user associations

-- First, create the function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at 
    BEFORE UPDATE ON loans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing (optional - remove in production)
-- This will only insert if there are users in the users table
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insert sample loans for testing
        INSERT INTO loans (
            user_id, 
            loan_amount, 
            duration_months, 
            interest_rate, 
            monthly_payment, 
            total_amount, 
            status
        ) VALUES 
        (
            test_user_id,
            15000.00,
            24,
            5.0,
            658.33,
            15800.00,
            'In Repayment'
        ),
        (
            test_user_id,
            5000.00,
            12,
            5.0,
            229.17,
            5250.00,
            'Pending Approval'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Verify the table was created and show sample data
SELECT 
    l.id,
    u.email,
    l.loan_amount,
    l.duration_months,
    l.status,
    l.application_date
FROM loans l
JOIN users u ON l.user_id = u.id
ORDER BY l.application_date DESC
LIMIT 5;