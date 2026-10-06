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
 *
 * Replaces simulated auth with Supabase session architecture.
 * Successfully logs in and routes to production dashboard (or pathway selection).
 */
export default function LoginRoute() {
  const router = useRouter();

  // 1. Successful Authentication handler
  const handleLoginSuccess = useCallback((user: UserProfile) => {
    // If the user already has a designated pathway, route directly to the health dashboard.
    // Otherwise, transition to pathway selection to ensure tailored clinical telemetry.
    if (user.pathway) {
      router.replace('/(app)');
    } else {
      router.replace('/pathway-selection');
    }
  }, [router]);

  // 2. Forgot Password integration
  const handleForgotPassword = useCallback(() => {
    router.push('/(auth)/forgot-password');
  }, [router]);

  // 3. Sign Up navigation (Screen 4)
  const handleSignUp = useCallback(() => {
    router.push('/(auth)/register');
  }, [router]);

  // 4. Social Auth integration boundaries
  const handleGoogleLogin = useCallback(() => {
    Alert.alert(
      'Google Sign-In',
      'Google OAuth is configured via our Supabase backend. On mobile, please sign in with your registered email and password or use the BioPulse web portal.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleAppleLogin = useCallback(() => {
    Alert.alert(
      'Apple Sign-In',
      'Apple ID Authentication is not currently enabled for this project environment. Please authenticate with your BioPulse email and password.',
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
