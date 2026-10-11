import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { BioPulseSignupScreen } from '../../components/auth';
import { UserProfile, signInWithGoogle } from '../../features/authentication';

/**
 * BioPulse AI Mobile Create Account / Sign Up Route (`/(auth)/register`)
 *
 * Screen 4: Inclusive account registration for both Female (PCOS)
 * and Male (Hypogonadism) health pathways.
 *
 * Replaces simulated signup with real Supabase user provisioning.
 * Post-signup routes directly to pathway selection (never /design-system).
 */
export default function RegisterRoute() {
  const router = useRouter();

  // 1. Back Navigation
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  }, [router]);

  // 2. Successful Registration Handler
  const handleSignupSuccess = useCallback((user: UserProfile) => {
    // Retain pathway neutrality: newly registered users transition to pathway selection
    // to choose between the Female (PCOS) or Male (Hypogonadism) care journeys.
    router.replace('/pathway-selection');
  }, [router]);

  // 3. Navigate to Login
  const handleLoginPress = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(auth)/login');
    }
  }, [router]);

  // 4. Terms of Service Integration Route
  const handleTermsPress = useCallback(() => {
    router.push('/(auth)/terms');
  }, [router]);

  // 5. Privacy Policy Integration Route
  const handlePrivacyPress = useCallback(() => {
    router.push('/(auth)/privacy');
  }, [router]);

  // 6. Social Sign-Up Integration
  const handleGoogleSignup = useCallback(async () => {
    try {
      const res = await signInWithGoogle();
      if (!res.success && res.error) {
        Alert.alert(
          'Google Sign-Up Notice',
          res.error || 'Google authentication requires configuring Google OAuth Client ID in your Supabase project dashboard under Authentication > Providers > Google.'
        );
      }
    } catch (err: any) {
      Alert.alert('Google Sign-Up', err?.message || 'Failed to initiate Google sign-up.');
    }
  }, []);

  return (
    <BioPulseSignupScreen
      onBack={handleBack}
      onSignupSuccess={handleSignupSuccess}
      onLoginPress={handleLoginPress}
      onTermsPress={handleTermsPress}
      onPrivacyPress={handlePrivacyPress}
      onGoogleSignup={handleGoogleSignup}
    />
  );
}
