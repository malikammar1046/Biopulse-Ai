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
    // Retain pathway neutrality: subsequent onboarding handles pathway questionnaire.
    // Transition to application entry point.
    router.replace('/design-system');
  }, [router]);

  // 3. Navigate to Login
  const handleLoginPress = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(auth)/login');
    }
  }, [router]);

  // 4. Terms of Service Integration Boundary
  const handleTermsPress = useCallback(() => {
    Alert.alert(
      'Terms of Service',
      'BioPulse AI provides personalized health intelligence and screening support. It is not an acute diagnostic service. By using BioPulse AI, you agree to our standard terms.\n\n(Route boundary: /(legal)/terms).',
      [{ text: 'Close' }]
    );
  }, []);

  // 5. Privacy Policy Integration Boundary
  const handlePrivacyPress = useCallback(() => {
    Alert.alert(
      'Privacy Policy',
      'All biometric, symptom, and hormonal health information is securely encrypted. We never share or sell personal health telemetry.\n\n(Route boundary: /(legal)/privacy).',
      [{ text: 'Close' }]
    );
  }, []);

  // 6. Social Sign-Up Integration Boundaries
  const handleGoogleSignup = useCallback(() => {
    Alert.alert(
      'Google Sign-Up',
      'Google Authentication SDK is not configured in this environment. Please register using your full name, email, and password.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleAppleSignup = useCallback(() => {
    Alert.alert(
      'Apple Sign-Up',
      'Apple Authentication SDK is not configured in this environment. Please register using your full name, email, and password.',
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
