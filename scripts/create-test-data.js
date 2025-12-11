const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🧪 Creating test data...');
  console.log('========================\n');

  try {
    // First, let's see what users exist
    console.log('1. Checking existing users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });

    if (users.length === 0) {
      console.log('\n2. Creating test user...');
      
      // Create a test user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          phone: '+1234567890',
          role: 'user'
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating user:', createError.message);
        return;
      }

      console.log('✅ Test user created:', newUser.email);
      users.push(newUser);
    }

    // Create activation profile for the first user
    const testUser = users[0];
    console.log(`\n3. Creating activation profile for ${testUser.email}...`);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_activation_profiles')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (existingProfile) {
      console.log('✅ Activation profile already exists');
      console.log('Profile data:', {
        fullName: existingProfile.full_name,
        status: existingProfile.activation_status,
        step: existingProfile.current_step
      });
    } else {
      // Create new activation profile
      const { data: newProfile, error: profileError } = await supabase
        .from('user_activation_profiles')
        .insert({
          user_id: testUser.id,
          full_name: 'Test User Profile',
          gender: 'male',
          date_of_birth: '1990-01-01',
          marital_status: 'single',
          nationality: 'Pakistani',
          agreed_to_terms: true,
          residing_country: 'Pakistan',
          state_region_province: 'Sindh',
          town_city: 'Karachi',
          id_type: 'NIC',
          id_number: '12345-1234567-1',
          account_type: 'bank',
          bank_name: 'Test Bank',
          account_number: '1234567890',
          account_holder_name: 'Test User',
          activation_status: 'in_progress',
          current_step: 3,
          family_relatives: [
            {
              fullName: 'John Doe',
              relationship: 'brother',
              phoneNumber: '+1234567891'
            }
          ]
        })
        .select()
        .single();

      if (profileError) {
        console.log('❌ Error creating profile:', profileError.message);
        return;
      }

      console.log('✅ Activation profile created');
      console.log('Profile data:', {
        fullName: newProfile.full_name,
        status: newProfile.activation_status,
        step: newProfile.current_step
      });
    }

    console.log('\n4. Testing profile retrieval...');
    
    const { data: profileTest, error: testError } = await supabase
      .from('user_activation_profiles')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (testError) {
      console.log('❌ Error retrieving profile:', testError.message);
    } else {
      console.log('✅ Profile retrieval successful');
      console.log('Retrieved data:', {
        fullName: profileTest.full_name,
        country: profileTest.residing_country,
        city: profileTest.town_city,
        bankName: profileTest.bank_name
      });
    }

    console.log('\n🎉 Test data creation completed!');
    console.log('\nTo test in your app:');
    console.log(`1. Login with email: ${testUser.email}`);
    console.log('2. Visit the profile page');
    console.log('3. Check that data loads properly');

  } catch (error) {
    console.error('❌ Test data creation failed:', error);
  }
}

createTestData();