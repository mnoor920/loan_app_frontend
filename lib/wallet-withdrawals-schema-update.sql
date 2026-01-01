-- Update wallet_withdrawals table to support approval workflow
-- Run this migration to update the status constraint

-- First, update existing records to new status values
UPDATE wallet_withdrawals 
SET status = 'pending' 
WHERE status IN ('processing', 'pending');

UPDATE wallet_withdrawals 
SET status = 'approved' 
WHERE status = 'completed';

UPDATE wallet_withdrawals 
SET status = 'rejected' 
WHERE status IN ('failed', 'cancelled');

-- Drop the old constraint
ALTER TABLE wallet_withdrawals 
DROP CONSTRAINT IF EXISTS wallet_withdrawals_status_check;

-- Add new constraint with approval workflow statuses
ALTER TABLE wallet_withdrawals 
ADD CONSTRAINT wallet_withdrawals_status_check 
CHECK (status IN ('pending', 'review', 'approved', 'rejected'));

-- Change default status to 'pending'
ALTER TABLE wallet_withdrawals 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add reviewed_by and reviewed_at columns for tracking admin actions
ALTER TABLE wallet_withdrawals 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Update previous_balance and new_balance to be nullable (since we won't deduct on creation)
ALTER TABLE wallet_withdrawals 
ALTER COLUMN previous_balance DROP NOT NULL,
ALTER COLUMN new_balance DROP NOT NULL;

-- Add index for reviewed_by
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_reviewed_by ON wallet_withdrawals(reviewed_by);

