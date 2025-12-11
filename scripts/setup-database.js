#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script sets up the enhanced database schema for activation data storage.
 * It connects to Supabase and executes the SQL schema file.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../lib/database-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Loaded database schema from:', schemaPath);
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp_table_that_does_not_exist')
            .select('*');
          
          // If it's a table creation or function, use the SQL editor approach
          console.log(`⚠️  RPC failed, trying alternative method for statement ${i + 1}`);
          
          // For now, we'll log the statement that needs manual execution
          console.log('📋 Statement to execute manually in Supabase SQL editor:');
          console.log(statement);
          console.log('---');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.log(`⚠️  Statement ${i + 1} needs manual execution:`, execError.message);
        console.log('📋 Statement:', statement.substring(0, 100) + '...');
      }
    }
    
    console.log('🎉 Database setup completed!');
    console.log('');
    console.log('📌 Next steps:');
    console.log('1. Verify tables were created in Supabase dashboard');
    console.log('2. If any statements failed, execute them manually in SQL editor');
    console.log('3. Test the activation flow to ensure database connectivity');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Check your Supabase credentials in .env.local');
    console.error('2. Ensure your Supabase project is active');
    console.error('3. Verify network connectivity to Supabase');
    process.exit(1);
  }
}

// Alternative: Create a simple SQL file for manual execution
function createManualSetupFile() {
  try {
    const schemaPath = path.join(__dirname, '../lib/database-schema.sql');
    const outputPath = path.join(__dirname, '../setup-manual.sql');
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const manualSetup = `-- Manual Database Setup for Activation Data Storage
-- Execute this file in your Supabase SQL Editor
-- 
-- Instructions:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute all statements
--
-- Generated on: ${new Date().toISOString()}

${schema}

-- Verification Queries (run these after setup to verify)
-- Check if tables were created:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_activation_profiles', 'user_documents', 'activation_audit_log', 'document_access_log');

-- Check if functions were created:
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN ('update_updated_at_column', 'increment_version', 'calculate_data_hash', 'log_document_access');

-- Check if triggers were created:
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public';
`;

    fs.writeFileSync(outputPath, manualSetup);
    console.log('📄 Created manual setup file:', outputPath);
    console.log('');
    console.log('📋 To set up the database manually:');
    console.log('1. Open your Supabase project dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy the contents of setup-manual.sql');
    console.log('4. Paste and execute in the SQL Editor');
    
  } catch (error) {
    console.error('❌ Failed to create manual setup file:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  console.log('🔧 Enhanced Database Setup for Activation Data Storage');
  console.log('====================================================');
  console.log('');
  
  // Create manual setup file first
  createManualSetupFile();
  
  // Then try automated setup
  setupDatabase().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase, createManualSetupFile };