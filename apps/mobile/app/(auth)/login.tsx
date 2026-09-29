import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { BioPulseLoginScreen } from '../../components/auth';
import { UserProfile } from '../../features/authentication';

/**
 * BioPulse AI Mobile Login Route (`/(auth)/login`)
 *
 * Screen 3: Returning user authentication for both Female (PCOS)
 * and Male (Hypogonadism) health pathways.
 */
export default function LoginRoute() {
  const router = useRouter();

  // 1. Successful Authentication handler
  const handleLoginSuccess = useCallback((user: UserProfile) => {
    // Navigate into the application's authenticated route flow
    router.replace('/design-system');
  }, [router]);

  // 2. Forgot Password integration boundary
  const handleForgotPassword = useCallback(() => {
    Alert.alert(
      'Password Recovery',
      'The password reset flow has not yet been implemented in this repository. When built, this boundary will route to /(auth)/forgot-password.',
      [{ text: 'OK' }]
    );
  }, []);

  // 3. Sign Up navigation (Screen 4)
  const handleSignUp = useCallback(() => {
    router.push('/(auth)/register');
  }, [router]);

  // 4. Social Auth integration boundaries
  const handleGoogleLogin = useCallback(() => {
    Alert.alert(
      'Google Authentication',
      'Google Sign-In SDK is not installed or configured in this environment. Please authenticate using your BioPulse email and password.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleAppleLogin = useCallback(() => {
    Alert.alert(
      'Apple Authentication',
      'Apple Authentication SDK is not installed or configured in this environment. Please authenticate using your BioPulse email and password.',
      [{ text: 'OK' }]
    );
  }, []);

  return (
    <BioPulseLoginScreen
      onLoginSuccess={handleLoginSuccess}
      onForgotPassword={handleForgotPassword}
      onSignUp={handleSignUp}
      onGoogleLogin={handleGoogleLogin}
      onAppleLogin={handleAppleLogin}
    />
  );
}
