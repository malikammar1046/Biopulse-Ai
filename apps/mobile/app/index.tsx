import React, { useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BioPulseSplashScreen } from '../components/splash';
import { useAuth } from '../features/authentication';

/**
 * BioPulse AI Mobile Launch / Splash Experience
 *
 * Startup Route:
 * - Mounts immediately upon app launch
 * - Displays the dual-pathway BioPulse splash screen
 * - Resolves application initialization & session restoration
 * - Seamlessly transitions to authenticated home or onboarding flow
 */
export default function StartupScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const params = useLocalSearchParams<{ preview?: string }>();
  const isPreview = params.preview === 'true';

  const handleInitializationComplete = useCallback(() => {
    if (isPreview) {
      return;
    }
    // Route to main application if valid session is active, otherwise onboarding
    if (isAuthenticated) {
      router.replace('/(app)');
    } else {
      router.replace('/onboarding');
    }
  }, [isPreview, isAuthenticated, router]);

  return (
    <BioPulseSplashScreen
      onInitializationComplete={handleInitializationComplete}
      autoNavigate={!isPreview}
      minDisplayTimeMs={1800}
    />
  );
}
