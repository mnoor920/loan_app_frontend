-- Create wallet_withdrawals table for tracking wallet balance withdrawals
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  bank_details JSONB NOT NULL,
  previous_balance DECIMAL(12, 2) NOT NULL,
  new_balance DECIMAL(12, 2) NOT NULL,
  transaction_id VARCHAR(255),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user_id ON wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON wallet_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_created_at ON wallet_withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_transaction_id ON wallet_withdrawals(transaction_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_wallet_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_withdrawals_updated_at_trigger
    BEFORE UPDATE ON wallet_withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_wallet_withdrawals_updated_at();


