-- Create loan_withdrawal_codes table
CREATE TABLE IF NOT EXISTS loan_withdrawal_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active code per loan
  CONSTRAINT unique_active_code UNIQUE (loan_id, code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_codes_loan_id ON loan_withdrawal_codes(loan_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_codes_code ON loan_withdrawal_codes(code);
CREATE INDEX IF NOT EXISTS idx_withdrawal_codes_is_used ON loan_withdrawal_codes(is_used);

-- Function to clean up old unused codes (optional maintenance)
-- Assuming we might want to expire them, but requirements didn't specify expiration yet.
