-- Update loan statuses to support new statuses: Review, Pending, Reject, On hold
-- This script updates the loan_applications table to allow the new statuses
-- while maintaining backward compatibility with existing statuses

-- First, drop the existing check constraint if it exists
ALTER TABLE loan_applications 
DROP CONSTRAINT IF EXISTS loan_applications_status_check;

-- Add new check constraint with all statuses (old + new)
ALTER TABLE loan_applications 
ADD CONSTRAINT loan_applications_status_check 
CHECK (status IN (
    'Pending Approval',  -- Original statuses
    'Approved',
    'In Repayment',
    'Completed',
    'Rejected',
    'Review',            -- New statuses
    'Pending',
    'Reject',
    'On hold'
));

-- Also update the loans table if it exists (for backward compatibility)
ALTER TABLE loans 
DROP CONSTRAINT IF EXISTS loans_status_check;

ALTER TABLE loans 
ADD CONSTRAINT loans_status_check 
CHECK (status IN (
    'Pending Approval',
    'Approved',
    'In Repayment',
    'Completed',
    'Rejected',
    'Review',
    'Pending',
    'Reject',
    'On hold'
));

-- Verify the changes
SELECT 
    table_name,
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%status_check%'
ORDER BY table_name;

