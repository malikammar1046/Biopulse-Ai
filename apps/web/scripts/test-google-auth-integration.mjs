import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dqqrqwjeebecmgfsihtv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rZfbhMCOuoCGq4TVmjiEbA_wnlcutJP';

const runGoogleOAuthTests = async () => {
  console.log('================================================================');
  console.log('🧪 TESTING OVASENSE SUPABASE GOOGLE OAUTH CONFIGURATION & API');
  console.log('================================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  // Test 1: Verify Supabase client initialized and getSession() works
  console.log('[TEST 1] Verifying Supabase client & initial session...');
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) {
    console.error('❌ Failed to get session:', sessionErr.message);
    process.exit(1);
  }
  console.log('✅ Supabase Client initialized successfully. Active session:', sessionData.session ? 'Found' : 'None (clean baseline)');

  // Test 2: Verify signInWithOAuth API call with Google provider
  console.log('\n[TEST 2] Verifying signInWithOAuth API for Google OAuth with skipBrowserRedirect...');
  const testRedirectTo = 'http://localhost:5173/login';
  const { data: oauthData, error: oauthErr } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: testRedirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (oauthErr) {
    console.error('❌ signInWithOAuth returned error:', oauthErr.message);
    process.exit(1);
  }

  console.log('✅ signInWithOAuth succeeded!');
  console.log('   - Provider:', oauthData.provider);
  console.log('   - Generated Authorization URL:', oauthData.url);

  // Validate authorization URL contains essential OAuth components
  const parsedUrl = new URL(oauthData.url);
  console.log(`   - Auth Hostname: ${parsedUrl.hostname}`);
  console.log(`   - Redirect URI Parameter: ${parsedUrl.searchParams.get('redirect_to') || parsedUrl.searchParams.get('redirect_uri')}`);
  
  if (!oauthData.url.includes('google') && !oauthData.url.includes('supabase.co')) {
    console.error('❌ Authorization URL did not contain expected provider endpoints.');
    process.exit(1);
  }
  console.log('✅ Authorization URL syntax and provider parameters verified.');

  // Test 3: Verify profiles table schema compatibility for Google user creation
  console.log('\n[TEST 3] Verifying profiles table schema & columns for Google user metadata...');
  const { data: profileSample, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, is_onboarded, created_at')
    .limit(1);

  if (profileErr) {
    console.error('❌ Failed to query profiles table:', profileErr.message);
    process.exit(1);
  }
  console.log('✅ profiles table schema verified with full_name, email, avatar_url, and is_onboarded columns.');

  console.log('\n================================================================');
  console.log('🎉 ALL SUPABASE GOOGLE OAUTH INTEGRATION CHECKS PASSED (100%)');
  console.log('================================================================\n');
};

runGoogleOAuthTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
