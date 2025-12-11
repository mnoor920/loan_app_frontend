// Test script to check activation database setup
// Run with: node loan-app/lib/test-activation-db.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('🔍 Testing activation database setup...\n');

  try {
    // Test 1: Check if users table exists
    console.log('1. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      return;
    }
    console.log('✅ Users table exists');

    // Test 2: Check if user_activation_profiles table exists
    console.log('\n2. Checking user_activation_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_activation_profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ user_activation_profiles table error:', profilesError.message);
      console.log('\n📋 You need to run the complete-activation-schema.sql file in Supabase SQL Editor');
      return;
    }
    console.log('✅ user_activation_profiles table exists');

    // Test 3: Check table structure
    console.log('\n3. Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_activation_profiles' })
      .single();

    if (tableError) {
      console.log('⚠️ Could not get table structure details, but table exists');
    }

    // Test 4: Try to create a test activation profile
    console.log('\n4. Testing activation profile creation...');
    
    if (users && users.length > 0) {
      const testUserId = users[0].id;
      
      // Try to insert a test profile
      const { data: testProfile, error: insertError } = await supabase
        .from('user_activation_profiles')
        .upsert({
          user_id: testUserId,
          full_name: 'Test User',
          gender: 'male',
          activation_status: 'in_progress',
          current_step: 1
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create test profile:', insertError.message);
        console.log('\n🔧 This might indicate missing columns. Run complete-activation-schema.sql');
        return;
      }

      console.log('✅ Test profile created successfully:', testProfile.id);

      // Clean up test data
      await supabase
        .from('user_activation_profiles')
        .delete()
        .eq('id', testProfile.id);
      
      console.log('✅ Test data cleaned up');
    }

    // Test 5: Check user_documents table
    console.log('\n5. Checking user_documents table...');
    const { data: documents, error: documentsError } = await supabase
      .from('user_documents')
      .select('*')
      .limit(1);

    if (documentsError) {
      console.error('❌ user_documents table error:', documentsError.message);
      console.log('📋 Run complete-activation-schema.sql to create this table');
    } else {
      console.log('✅ user_documents table exists');
    }

    // Test 6: Check audit log table
    console.log('\n6. Checking activation_audit_log table...');
    const { data: auditLogs, error: auditError } = await supabase
      .from('activation_audit_log')
      .select('*')
      .limit(1);

    if (auditError) {
      console.error('❌ activation_audit_log table error:', auditError.message);
      console.log('📋 Run complete-activation-schema.sql to create this table');
    } else {
      console.log('✅ activation_audit_log table exists');
    }

    console.log('\n🎉 Database test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. If any tables are missing, run complete-activation-schema.sql in Supabase SQL Editor');
    console.log('2. Test the activation form in your app');
    console.log('3. Check the browser console for any errors');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Run the test
testDatabase().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});