-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  bank_details JSONB NOT NULL,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_withdrawals_updated_at_trigger
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_withdrawals_updated_at();
