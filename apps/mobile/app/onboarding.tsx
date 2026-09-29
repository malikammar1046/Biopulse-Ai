import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { BioPulseOnboardingIntroScreen } from '../components/onboarding';

/**
 * BioPulse AI First Onboarding Screen (/onboarding)
 *
 * Appears immediately following the Splash / Launch Screen.
 * Dual-pathway introduction to female (PCOS) and male (hypogonadism) health monitoring.
 */
export default function OnboardingScreen() {
  const router = useRouter();

  // 1. Skip action integration boundary
  const handleSkip = useCallback(() => {
    // When authentication / home routes are added in future screens,
    // this can navigate directly to the auth or app entry point.
    router.replace('/design-system');
  }, [router]);

  // 2. Primary CTA: Get Started integration boundary
  const handleGetStarted = useCallback(() => {
    // When subsequent onboarding slides (e.g. pathway selection) are built,
    // continue to the next step.
    router.replace('/design-system');
  }, [router]);

  // 3. Secondary CTA: I already have an account navigation
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
