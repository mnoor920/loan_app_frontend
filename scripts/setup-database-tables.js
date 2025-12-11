const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🔧 Setting up database tables...');
  console.log('=====================================\n');

  try {
    // Check if users table exists
    console.log('1. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.log('❌ Users table not found. Creating basic users table...');
      
      const createUsersSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          phone VARCHAR(20),
          role VARCHAR(20) DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql_query: createUsersSQL 
      });

      if (createError) {
        console.log('⚠️  Could not create users table automatically');
        console.log('Please create it manually in Supabase dashboard');
      } else {
        console.log('✅ Users table created');
      }
    } else {
      console.log('✅ Users table exists');
    }

    // Create activation profiles table
    console.log('\n2. Setting up user_activation_profiles table...');
    
    const activationSQL = `
      CREATE TABLE IF NOT EXISTS user_activation_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        
        -- Step 1: Personal Information
        gender VARCHAR(10),
        full_name VARCHAR(255),
        date_of_birth DATE,
        marital_status VARCHAR(20),
        nationality VARCHAR(100),
        agreed_to_terms BOOLEAN DEFAULT FALSE,
        
        -- Step 2: Family/Character References
        family_relatives JSONB,
        
        -- Step 3: Address Information
        residing_country VARCHAR(100),
        state_region_province VARCHAR(100),
        town_city VARCHAR(100),
        
        -- Step 4: Identification
        id_type VARCHAR(20),
        id_number VARCHAR(50),
        
        -- Step 5: Bank Information
        account_type VARCHAR(20),
        bank_name VARCHAR(100),
        account_number VARCHAR(50),
        account_holder_name VARCHAR(255),
        
        -- Step 6: Signature
        signature_data TEXT,
        
        -- Status tracking
        activation_status VARCHAR(20) DEFAULT 'pending' CHECK (activation_status IN ('pending', 'in_progress', 'completed', 'rejected')),
        current_step INTEGER DEFAULT 1,
        completed_at TIMESTAMP WITH TIME ZONE,
        
        -- Metadata
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Constraints
        UNIQUE(user_id)
      );
      
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_user_id ON user_activation_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_status ON user_activation_profiles(activation_status);
      CREATE INDEX IF NOT EXISTS idx_user_activation_profiles_step ON user_activation_profiles(current_step);
    `;

    const { error: activationError } = await supabase.rpc('exec_sql', { 
      sql_query: activationSQL 
    });

    if (activationError) {
      console.log('⚠️  Could not create activation profiles table automatically');
      console.log('Error:', activationError.message);
    } else {
      console.log('✅ user_activation_profiles table created');
    }

    // Create documents table
    console.log('\n3. Setting up user_documents table...');
    
    const documentsSQL = `
      CREATE TABLE IF NOT EXISTS user_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        activation_profile_id UUID,
        document_type VARCHAR(50) NOT NULL,
        original_filename VARCHAR(255),
        file_path VARCHAR(500),
        file_size INTEGER,
        mime_type VARCHAR(100),
        verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
        verification_notes TEXT,
        verified_by UUID,
        verified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_documents_type ON user_documents(document_type);
      CREATE INDEX IF NOT EXISTS idx_user_documents_status ON user_documents(verification_status);
    `;

    const { error: documentsError } = await supabase.rpc('exec_sql', { 
      sql_query: documentsSQL 
    });

    if (documentsError) {
      console.log('⚠️  Could not create documents table automatically');
      console.log('Error:', documentsError.message);
    } else {
      console.log('✅ user_documents table created');
    }

    // Test the setup
    console.log('\n4. Testing database setup...');
    
    const { data: profileTest, error: profileTestError } = await supabase
      .from('user_activation_profiles')
      .select('id')
      .limit(1);

    if (profileTestError) {
      console.log('❌ Database setup test failed:', profileTestError.message);
    } else {
      console.log('✅ Database setup test passed');
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\nNext steps:');
    console.log('1. Visit your profile page to test data loading');
    console.log('2. Create some test activation data');
    console.log('3. Check that caching is working properly');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n📝 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run the SQL from: lib/minimal-schema.sql');
    console.log('4. Then run the SQL from: database/migrations/add_profile_performance_indexes.sql');
  }
}

setupDatabase();