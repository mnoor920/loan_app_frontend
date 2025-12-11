-- Create the basic users table if it doesn't exist
-- This is required for the authentication system to work

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add trigger for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a test user (you can remove this after testing)
INSERT INTO users (email, phone_number, first_name, last_name, password_hash, role) 
VALUES (
  'shahram123@gmail.com',
  '03001234567',
  'Shahram',
  'Test',
  '$2a$12$LQv3c1yqBw2LeOuJQkNOCOxhyUk.HiuouxOlcwBjjb4f/Aq7pim3u', -- password: password123
  'user'
) ON CONFLICT (email) DO NOTHING;

-- Verify the user was created
SELECT id, email, first_name, last_name, role FROM users WHERE email = 'shahram123@gmail.com';