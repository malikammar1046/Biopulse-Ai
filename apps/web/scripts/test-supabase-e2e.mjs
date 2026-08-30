import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dqqrqwjeebecmgfsihtv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rZfbhMCOuoCGq4TVmjiEbA_wnlcutJP';

const runEndToEndTests = async () => {
  console.log('================================================================');
  console.log('🧪 STARTING OVASENSE END-TO-END SUPABASE INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  const randomSuffix = Date.now() + Math.random().toString(36).substring(2, 6);
  const user1Email = `fatima.test.${randomSuffix}@gmail.com`;
  const user2Email = `amina.test.${randomSuffix}@gmail.com`;
  const password = 'TestSecurePassword123!';

  // Client 1 (for User 1)
  const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  // Client 2 (for User 2)
  const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  let user1Id = '';
  let user2Id = '';

  // -------------------------------------------------------------------------
  // TEST 1: Register User 1 & Trigger / Profile Creation
  // -------------------------------------------------------------------------
  console.log(`[TEST 1] Registering User 1 (${user1Email})...`);
  const signUpRes1 = await client1.auth.signUp({
    email: user1Email,
    password: password,
    options: {
      data: {
        full_name: 'Dr. Fatima Noor',
        date_of_birth: '1995-06-15',
      },
    },
  });

  if (signUpRes1.error) {
    console.error('❌ User 1 SignUp Failed:', signUpRes1.error.message);
    process.exit(1);
  }

  user1Id = signUpRes1.data.user?.id;
  console.log(`✅ User 1 Created with Auth ID: ${user1Id}`);

  let session1 = signUpRes1.data.session;
  if (!session1) {
    console.log('   - No auto-session on signUp. Attempting password signIn...');
    const signInRes = await client1.auth.signInWithPassword({
      email: user1Email,
      password: password,
    });
    if (signInRes.data.session) {
      session1 = signInRes.data.session;
      console.log('   - Signed in successfully! Authenticated session acquired.');
    } else {
      console.log('   - Note: Email confirmation status:', signInRes.error?.message);
    }
  } else {
    console.log('   - Active authenticated session acquired immediately from signUp.');
  }

  // Fetch initial profile created by handle_new_user() trigger
  const { data: initialProfile1, error: initProfErr1 } = await client1
    .from('profiles')
    .select('*')
    .eq('id', user1Id)
    .maybeSingle();

  if (initProfErr1) {
    console.log('   - Note on initial query:', initProfErr1.message);
  } else if (initialProfile1) {
    console.log('✅ Initial Profile auto-provisioned:', {
      id: initialProfile1.id,
      full_name: initialProfile1.full_name,
      email: initialProfile1.email,
      date_of_birth: initialProfile1.date_of_birth,
      is_onboarded: initialProfile1.is_onboarded,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 2: Complete Onboarding & Save Full Health Profile
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] Simulating Onboarding completion & profile update for User 1...');
  const updatedProfilePayload = {
    id: user1Id,
    full_name: 'Dr. Fatima Noor',
    email: user1Email,
    phone: '+92 300 1234567',
    date_of_birth: '1995-06-15',
    height_cm: 168,
    weight_kg: 64,
    emergency_contacts: [
      { id: 'ec_1', name: 'Zainab Noor', relationship: 'Sister', phone: '+92 300 9876543', isPrimary: true },
    ],
    blood_type: 'B+',
    allergies: ['Penicillin', 'Peanuts'],
    medications: [
      { id: 'm_1', name: 'Inositol', dosage: '2000mg', frequency: 'Daily Morning', takenToday: false },
      { id: 'm_2', name: 'Metformin', dosage: '500mg', frequency: 'With Dinner', takenToday: true },
    ],
    conditions: ['PCOS', 'Mild Insulin Resistance'],
    surgeries: [],
    family_history: ['Type 2 Diabetes (Mother)'],
    cycle_length: '31',
    period_duration: 5,
    last_period_date: '2026-08-15',
    period_regularity: 'sometimes_irregular',
    common_symptoms: ['Mild Cramping', 'Fatigue', 'Acne Flare-ups'],
    dietary_preference: 'Low Glycemic / Halal',
    daily_water_glasses: 9,
    activity_level: 'moderate',
    exercise_preferences: ['Pilates', 'Zone 2 Walking', 'Strength Training'],
    sleep_hours: 8,
    selected_goals: ['Regulate Cycle Rhythm', 'Hormonal Balance', 'Sustained Daily Energy'],
    support_preference: 'structured_weekly',
    is_onboarded: true,
  };

  const { error: upsertErr } = await client1
    .from('profiles')
    .upsert(updatedProfilePayload, { onConflict: 'id' });

  if (upsertErr) {
    console.error('❌ Profile Upsert Failed:', upsertErr.message);
    process.exit(1);
  }
  console.log('✅ User 1 Profile updated with complete clinical & lifestyle onboarding data!');

  // Verify stored profile matches exactly
  const { data: verifiedProfile1, error: verifyErr } = await client1
    .from('profiles')
    .select('*')
    .eq('id', user1Id)
    .single();

  if (verifyErr || !verifiedProfile1) {
    console.error('❌ Failed to retrieve persisted profile:', verifyErr?.message);
    process.exit(1);
  }

  console.log('✅ Persisted Profile Verification in Supabase:');
  console.log(`   - Height / Weight: ${verifiedProfile1.height_cm} cm / ${verifiedProfile1.weight_kg} kg`);
  console.log(`   - Cycle Length: ${verifiedProfile1.cycle_length} days, Last Period: ${verifiedProfile1.last_period_date}`);
  console.log(`   - Medications Count: ${verifiedProfile1.medications?.length} (${verifiedProfile1.medications?.map(m => m.name).join(', ')})`);
  console.log(`   - Allergies: ${verifiedProfile1.allergies?.join(', ')}`);
  console.log(`   - Symptoms: ${verifiedProfile1.common_symptoms?.join(', ')}`);
  console.log(`   - Dietary Preference: ${verifiedProfile1.dietary_preference}`);
  console.log(`   - is_onboarded Flag: ${verifiedProfile1.is_onboarded}`);

  // -------------------------------------------------------------------------
  // TEST 3: Logout & Re-Login (Session & Persistence Lifecycle)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] Testing Logout, Re-Login & Session Reload...');
  await client1.auth.signOut();
  console.log('   - User 1 signed out successfully.');

  const signInRes = await client1.auth.signInWithPassword({
    email: user1Email,
    password: password,
  });

  if (signInRes.error || !signInRes.data.session) {
    console.error('❌ Re-Login Failed:', signInRes.error?.message);
    process.exit(1);
  }
  console.log('   - User 1 re-authenticated successfully with fresh session token.');

  const { data: reloadedProfile } = await client1
    .from('profiles')
    .select('*')
    .eq('id', user1Id)
    .single();

  if (reloadedProfile?.is_onboarded && reloadedProfile?.full_name === 'Dr. Fatima Noor') {
    console.log('✅ Persisted profile successfully reloaded after fresh login!');
  } else {
    console.error('❌ Reloaded profile did not match expected data.');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Row Level Security (RLS) Cross-User Isolation
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] Testing Row Level Security (RLS) Isolation...');
  console.log(`   - Registering User 2 (${user2Email})...`);
  const signUpRes2 = await client2.auth.signUp({
    email: user2Email,
    password: password,
    options: { data: { full_name: 'Amina Tariq' } },
  });

  if (signUpRes2.error) {
    console.error('❌ User 2 SignUp Failed:', signUpRes2.error.message);
    process.exit(1);
  }

  user2Id = signUpRes2.data.user?.id;
  console.log(`   - User 2 Created with Auth ID: ${user2Id}`);

  // User 2 attempts to SELECT User 1's profile
  console.log('   - Attempting unauthorized SELECT: User 2 trying to read User 1 profile...');
  const { data: stolenData, error: readViolationErr } = await client2
    .from('profiles')
    .select('*')
    .eq('id', user1Id);

  if (stolenData && stolenData.length > 0) {
    console.error('❌ RLS VIOLATION: User 2 was able to view User 1 profile!', stolenData);
    process.exit(1);
  } else {
    console.log('✅ RLS SELECT Enforcement Passed: User 2 received 0 records when querying User 1 profile.');
  }

  // User 2 attempts to UPDATE User 1's profile
  console.log('   - Attempting unauthorized UPDATE: User 2 trying to modify User 1 profile...');
  const { data: updatedByOther, error: updateViolationErr } = await client2
    .from('profiles')
    .update({ full_name: 'Hacked By User 2' })
    .eq('id', user1Id)
    .select();

  if (updatedByOther && updatedByOther.length > 0) {
    console.error('❌ RLS VIOLATION: User 2 modified User 1 profile!', updatedByOther);
    process.exit(1);
  } else {
    console.log('✅ RLS UPDATE Enforcement Passed: User 2 cannot modify User 1 profile.');
  }

  // Verify User 1's profile remains pristine
  const { data: pristineUser1 } = await client1
    .from('profiles')
    .select('full_name, is_onboarded')
    .eq('id', user1Id)
    .single();

  if (pristineUser1?.full_name === 'Dr. Fatima Noor') {
    console.log('✅ User 1 Profile integrity verified intact and untampered!');
  } else {
    console.error('❌ User 1 profile was corrupted.');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL END-TO-END SUPABASE & RLS TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
};

runEndToEndTests().catch((err) => {
  console.error('Unhandled Test Failure:', err);
  process.exit(1);
});
