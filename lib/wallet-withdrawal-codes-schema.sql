-- Create wallet_withdrawal_codes table
CREATE TABLE IF NOT EXISTS wallet_withdrawal_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active code per user
  CONSTRAINT unique_active_wallet_code UNIQUE (user_id, code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_codes_user_id ON wallet_withdrawal_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_codes_code ON wallet_withdrawal_codes(code);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_codes_is_used ON wallet_withdrawal_codes(is_used);

