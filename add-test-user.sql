-- Just add the test user (since the users table already exists)
INSERT INTO users (email, phone_number, first_name, last_name, password_hash, role) 
VALUES (
  'shahram123@gmail.com',
  '03001234567',
  'Shahram',
  'Test',
  '$2a$12$LQv3c1yqBw2LeOuJQkNOCOxhyUk.HiuouxOlcwBjjb4f/Aq7pim3u', -- password: password123
  'user'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Verify the user exists
SELECT id, email, first_name, last_name, role FROM users WHERE email = 'shahram123@gmail.com';