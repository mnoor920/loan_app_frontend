-- Clean setup script for BrightLend authentication
-- Run this entire script in Supabase SQL Editor

-- Drop existing table completely to start fresh
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow our app to work
CREATE POLICY "Allow public read access" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.users
    FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_phone ON public.users(phone_number);
CREATE INDEX idx_users_role ON public.users(role);

-- Grant necessary permissions to anon role (this is what our app uses)
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;