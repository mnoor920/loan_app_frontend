# Wallet Withdrawal Code Debugging Guide

## Problem Analysis

The error "Invalid verification code. Please contact admin to generate a new code." occurs when the wallet withdrawal service cannot find a matching code in the `wallet_withdrawal_codes` table.

## Root Cause Analysis

### Flow Diagram

```
1. Admin generates code:
   GenerateCodeModal (codeType="wallet", userId="USER_A")
   → adminApi.generateWalletWithdrawalCode(userId="USER_A")
   → POST /api/admin/users/USER_A/wallet-withdrawal-code
   → AdminService.generateWalletWithdrawalCode(userId="USER_A", adminId="ADMIN_ID")
   → INSERT INTO wallet_withdrawal_codes (user_id='USER_A', code='123456', is_used=false)

2. User withdraws:
   User enters code "123456"
   → POST /api/wallet/withdraw { amount: 5000, code: "123456" }
   → WalletService.createWalletWithdrawal({ userId: "USER_B", amount: 5000, code: "123456" })
   → SELECT * FROM wallet_withdrawal_codes WHERE user_id='USER_B' AND code='123456'
   → NO MATCH FOUND → ERROR
```

### Possible Issues

1. **Table doesn't exist** (MOST LIKELY)
   - The `wallet_withdrawal_codes` table might not be created in Supabase
   - Solution: Run the SQL schema file

2. **userId Mismatch**
   - Admin generates code for `userId_A`
   - User making withdrawal has `userId_B` (from auth token)
   - Solution: Verify userId matches

3. **Code not generated correctly**
   - Code generation API call fails silently
   - Code is generated but not saved to database
   - Solution: Check backend logs and database

4. **Code already used**
   - Code was used in a previous withdrawal
   - Solution: Generate a new code

5. **Code format mismatch**
   - Extra spaces, wrong format
   - Solution: Code is trimmed, but verify in database

## Step-by-Step Debugging

### Step 1: Verify Table Exists

Run this in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'wallet_withdrawal_codes';
```

**If table doesn't exist**, run:
```sql
-- Create the table (from wallet-withdrawal-codes-schema.sql)
CREATE TABLE IF NOT EXISTS wallet_withdrawal_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_active_wallet_code UNIQUE (user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_codes_user_id ON wallet_withdrawal_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_codes_code ON wallet_withdrawal_codes(code);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_codes_is_used ON wallet_withdrawal_codes(is_used);
```

### Step 2: Check if Code Was Generated

After admin generates a code, run:

```sql
-- Replace 'USER_ID_HERE' with the actual user_id
SELECT 
    id,
    user_id,
    code,
    is_used,
    created_at
FROM wallet_withdrawal_codes
WHERE user_id = 'USER_ID_HERE'  -- Replace with actual user_id
ORDER BY created_at DESC;
```

**Expected**: Should show the generated code with `is_used = false`

**If empty**: Code generation failed or used wrong userId

### Step 3: Verify userId Match

Check the userId from:
1. **Admin side**: The userId used when generating code (from loan detail view)
2. **User side**: The userId from the auth token (logged in user)

Run this to check:

```sql
-- Check user's auth token userId matches
-- This should match the userId used to generate the code
SELECT id, email, first_name, last_name 
FROM users 
WHERE id = 'USER_ID_FROM_AUTH_TOKEN';
```

### Step 4: Check Code Format

Run this to see exact code format in database:

```sql
-- Replace 'CODE_HERE' with the code user is trying to use
SELECT 
    id,
    user_id,
    code,
    LENGTH(code) as code_length,
    is_used,
    created_at
FROM wallet_withdrawal_codes
WHERE code = 'CODE_HERE'  -- Replace with actual code
ORDER BY created_at DESC;
```

### Step 5: Check Backend Logs

Look for these log messages in backend console:

```
Creating wallet withdrawal: { userId: '...', amount: ..., code: '...' }
Wallet withdrawal verification failed: No code found for user ... with code ...
User ... has X codes in database: [...]
```

## Common Scenarios

### Scenario 1: Table Doesn't Exist
**Symptom**: Error "Invalid verification code" immediately
**Solution**: Run the SQL schema file in Supabase

### Scenario 2: Wrong userId
**Symptom**: Code exists but for different user
**Error**: "This code belongs to a different user"
**Solution**: Generate code for the correct user (the one making withdrawal)

### Scenario 3: Code Already Used
**Symptom**: Code exists but `is_used = true`
**Error**: "This verification code has already been used"
**Solution**: Generate a new code

### Scenario 4: Code Never Generated
**Symptom**: No rows in `wallet_withdrawal_codes` for user
**Solution**: Admin needs to generate code using correct endpoint

## Verification Checklist

- [ ] `wallet_withdrawal_codes` table exists in Supabase
- [ ] Table has correct structure (columns: id, user_id, code, is_used, used_at, created_at)
- [ ] Admin generated code using `/api/admin/users/{userId}/wallet-withdrawal-code` (NOT loan endpoint)
- [ ] Code exists in database for the correct user_id
- [ ] Code `is_used = false`
- [ ] userId from auth token matches userId used to generate code
- [ ] Code format is exactly 6 digits (no spaces)

## Quick Fix Commands

### Create table if missing:
```sql
-- Run this in Supabase SQL Editor
\i loan-app/lib/wallet-withdrawal-codes-schema.sql
```

### Check recent codes:
```sql
SELECT * FROM wallet_withdrawal_codes 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check specific user:
```sql
SELECT * FROM wallet_withdrawal_codes 
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC;
```

## Next Steps

1. **Run diagnostic queries** from `loan-app/lib/diagnose-wallet-withdrawal.sql`
2. **Check backend logs** for detailed error messages
3. **Verify table exists** in Supabase
4. **Verify userId matches** between code generation and withdrawal
5. **Generate new code** if needed using correct endpoint

