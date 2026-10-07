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
  const { isAuthenticated, user, pathway } = useAuth();
  const params = useLocalSearchParams<{ preview?: string }>();
  const isPreview = params.preview === 'true';

  const handleInitializationComplete = useCallback(() => {
    if (isPreview) {
      return;
    }
    // Route to main application if valid session is active and onboarded, otherwise to onboarding/pathway
    if (isAuthenticated) {
      if (user?.isOnboarded === false) {
        if (pathway === 'male_hypogonadism' || pathway === 'male') {
          router.replace('/male-basic-info');
        } else if (pathway === 'female_pcos' || pathway === 'female') {
          router.replace('/female-basic-info');
        } else {
          router.replace('/pathway-selection');
        }
      } else {
        router.replace('/(app)');
      }
    } else {
      router.replace('/onboarding');
    }
  }, [isPreview, isAuthenticated, user?.isOnboarded, pathway, router]);

  return (
    <BioPulseSplashScreen
      onInitializationComplete={handleInitializationComplete}
      autoNavigate={!isPreview}
      minDisplayTimeMs={1800}
    />
  );
}
