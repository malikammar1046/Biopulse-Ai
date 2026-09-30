import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { BioPulseOnboardingIntroScreen } from '../components/onboarding';

/**
 * BioPulse AI First Onboarding Screen (/onboarding)
 *
 * Appears immediately following the Splash / Launch Screen.
 * Dual-pathway introduction to female (PCOS) and male (hypogonadism) health monitoring.
 *
 * Directs users into the real account creation, sign-in, or pathway selection flows.
 */
export default function OnboardingScreen() {
  const router = useRouter();

  // 1. Skip action -> navigate to account login
  const handleSkip = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  // 2. Primary CTA: Get Started -> navigate to account creation
  const handleGetStarted = useCallback(() => {
    router.push('/(auth)/register');
  }, [router]);

  // 3. Secondary CTA: I already have an account -> navigate to login
  const handleSignIn = useCallback(() => {
    router.push('/(auth)/login');
  }, [router]);

  return (
    <BioPulseOnboardingIntroScreen
      onSkip={handleSkip}
      onGetStarted={handleGetStarted}
      onSignIn={handleSignIn}
    />
  );
}
