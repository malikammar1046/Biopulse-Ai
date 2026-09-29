import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { BioPulseSignupScreen } from '../../components/auth';
import { UserProfile } from '../../features/authentication';

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

  // 6. Social Sign-Up Integration Boundaries
  const handleGoogleSignup = useCallback(() => {
    Alert.alert(
      'Google Sign-Up',
      'Google OAuth is configured via our Supabase backend. On mobile, please register with your full name, email, and password or use the BioPulse web portal.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleAppleSignup = useCallback(() => {
    Alert.alert(
      'Apple Sign-Up',
      'Apple ID Registration is not currently enabled for this project environment. Please register with your email and password.',
      [{ text: 'OK' }]
    );
  }, []);

  return (
    <BioPulseSignupScreen
      onBack={handleBack}
      onSignupSuccess={handleSignupSuccess}
      onLoginPress={handleLoginPress}
      onTermsPress={handleTermsPress}
      onPrivacyPress={handlePrivacyPress}
      onGoogleSignup={handleGoogleSignup}
      onAppleSignup={handleAppleSignup}
    />
  );
}
