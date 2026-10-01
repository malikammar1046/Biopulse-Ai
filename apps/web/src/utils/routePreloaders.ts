/**
 * Route Preloaders for BioPulse AI
 *
 * Pre-fetches lazy-loaded route module bundles into the browser module cache.
 * When the user transitions to these routes, React.lazy resolves instantly
 * without network round-trip pauses or stale-screen freezing.
 */

export const preloadFemaleOnboarding = () => {
  try {
    return import('../pages/onboarding/FemaleOnboarding');
  } catch {
    // Non-critical preloading fallback
    return null;
  }
};

export const preloadMaleOnboarding = () => {
  try {
    return import('../pages/onboarding/MaleOnboarding');
  } catch {
    return null;
  }
};

export const preloadOnboardingRoutes = () => {
  preloadFemaleOnboarding();
  preloadMaleOnboarding();
};

export const preloadDashboardRoutes = () => {
  try {
    return import('../pages/app/Dashboard');
  } catch {
    return null;
  }
};
