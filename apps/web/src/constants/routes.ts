export const ROUTES = {
  // Public Marketing Routes
  HOME: '/',
  ABOUT: '/about',
  CONDITIONS: '/conditions',
  UNDERSTAND_PCOS: '/understand-pcos',
  UNDERSTAND_PCOS_CANONICAL: '/understand/pcos',
  UNDERSTAND_MALE_HYPOGONADISM: '/understand/male-hypogonadism',
  UNDERSTAND_HYPOGONADISM: '/understand-hypogonadism',
  UNDERSTAND_MALE_FERTILITY: '/understand/male-fertility',
  WOMENS_HEALTH: '/health/womens-health',
  MENS_HEALTH: '/health/mens-health',
  HOW_IT_WORKS: '/how-it-works',
  AI_EXPLAINS: '/ai-that-explains',
  FOR_DOCTORS: '/for-doctors',
  TRUST_PRIVACY: '/trust-and-privacy',
  FEATURES: '/features',
  DOCTORS: '/doctors',
  CARE_CIRCLE: '/care-circle',
  CARE_PROVIDER_PORTAL: '/care-provider/:token',
  APP_DOWNLOAD: '/mobile-app',
  DOWNLOAD: '/download',
  CONTACT: '/contact',

  // Authentication & Onboarding Routes
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  ONBOARDING_FEMALE: '/onboarding/female',
  ONBOARDING_MALE: '/onboarding/male',
  ONBOARDING_GENERAL: '/onboarding/general',

  // Authenticated App Routes
  APP: {
    ROOT: '/app',
    DASHBOARD: '/app/dashboard',
    OVASENSE: '/app/ovasense',
    ANDROSENSE: '/app/androsense',
    VITASENSE: '/app/vitasense',
    HUB: '/app/hub',
    AI_TWIN: '/app/ai-twin',
    CHAT: '/app/chat',
    PROFILE: '/app/profile',
    CYCLE: '/app/cycle',
    SYMPTOMS: '/app/symptoms',
    DIET: '/app/diet',
    DIET_WEEK: '/app/diet/week',
    NUTRITION: '/app/nutrition',
    FITNESS: '/app/fitness',
    REPORTS: '/app/reports',
    MEDICATIONS: '/app/medications',
    CARE_CIRCLE: '/app/care-circle',
    APPOINTMENTS: '/app/appointments',
    ASSESSMENT: '/app/assessment',
    PROGRESS: '/app/progress',
    LIFESTYLE: '/app/lifestyle',
    TIMELINE: '/app/timeline',
    SETTINGS: '/app/settings',
  },
} as const;

/**
 * Returns the destination dashboard route based on user profile pathway / gender.
 */
export function getPathwayDashboardRoute(profile?: { pathway?: string; gender?: string } | null): string {
  if (!profile) return ROUTES.APP.OVASENSE;
  const pathway = profile.pathway || (profile.gender === 'female' ? 'female' : profile.gender === 'male' ? 'male' : 'female');
  if (pathway === 'female') return ROUTES.APP.OVASENSE;
  if (pathway === 'male') return ROUTES.APP.ANDROSENSE;
  return ROUTES.APP.VITASENSE;
}

/**
 * Returns the dedicated pathway onboarding route based on user profile pathway / gender.
 */
export function getPathwayOnboardingRoute(profile?: { pathway?: string; gender?: string } | null): string {
  if (!profile) return ROUTES.ONBOARDING;
  const pathway = profile.pathway || (profile.gender === 'female' ? 'female' : profile.gender === 'male' ? 'male' : undefined);
  if (pathway === 'female') return ROUTES.ONBOARDING_FEMALE;
  if (pathway === 'male') return ROUTES.ONBOARDING_MALE;
  if (pathway === 'general') return ROUTES.ONBOARDING_GENERAL;
  return ROUTES.ONBOARDING;
}