import React, { useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BioPulseSplashScreen } from '../components/splash';

/**
 * BioPulse AI Mobile Launch / Splash Experience
 *
 * Startup Route:
 * - Mounts immediately upon app launch
 * - Displays the dual-pathway BioPulse splash screen
 * - Resolves application initialization
 * - Seamlessly transitions to the existing application flow
 */
export default function StartupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preview?: string }>();
  const isPreview = params.preview === 'true';

  const handleInitializationComplete = useCallback(() => {
    if (isPreview) {
      return;
    }
    // Continue through the application's existing routing flow to first onboarding screen
    router.replace('/onboarding');
  }, [isPreview, router]);

  return (
    <BioPulseSplashScreen
      onInitializationComplete={handleInitializationComplete}
      autoNavigate={!isPreview}
      minDisplayTimeMs={1800}
    />
  );
}
