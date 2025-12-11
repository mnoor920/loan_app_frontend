-- Minimal Database Schema to Fix Admin Dashboard Users Section
-- Execute this in Supabase SQL Editor

-- User Activation Profile Table (Essential for admin dashboard)
CREATE TABLE IF NOT EXISTS user_activation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  
  -- Activation Status
  activation_status VARCHAR(20) DEFAULT 'pending' CHECK (activation_status IN ('pending', 'in_progress', 'completed', 'rejected')),
  current_step INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Essential indexes
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_user_id ON user_activation_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_status ON user_activation_profiles(activation_status);