# Required SQL Migrations for Withdrawal Approval System

## IMPORTANT: Run these SQL commands in Supabase SQL Editor

### Step 1: Run the Wallet Withdrawals Schema Update

Open Supabase SQL Editor and run the following:

```sql
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
```

### Step 2: Verify the Migration

After running the migration, verify the columns exist:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'wallet_withdrawals'
AND column_name IN ('reviewed_by', 'reviewed_at', 'previous_balance', 'new_balance');
```

You should see:
- `reviewed_by` (uuid, nullable)
- `reviewed_at` (timestamp with time zone, nullable)
- `previous_balance` (numeric, nullable)
- `new_balance` (numeric, nullable)

### Step 3: Check Status Constraint

Verify the status constraint:

```sql
-- Check constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'wallet_withdrawals_status_check';
```

The constraint should allow: 'pending', 'review', 'approved', 'rejected'

## If Migration Fails

If you get errors about columns already existing or constraints already existing, that's okay - the `IF NOT EXISTS` and `DROP CONSTRAINT IF EXISTS` should handle that. If you still get errors, share the error message.

