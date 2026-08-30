export const ROUTES = {
  // Public Marketing Routes
  HOME: '/',
  ABOUT: '/about',
  UNDERSTAND_PCOS: '/understand-pcos',
  HOW_IT_WORKS: '/how-it-works',
  FEATURES: '/features',
  CARE_CIRCLE: '/care-circle',
  CONTACT: '/contact',

  // Authentication & Onboarding Routes
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',

  // Authenticated App Routes
  APP: {
    ROOT: '/app',
    DASHBOARD: '/app/dashboard',
    PROFILE: '/app/profile',
    CYCLE: '/app/cycle',
    SYMPTOMS: '/app/symptoms',
    DIET: '/app/diet',
    FITNESS: '/app/fitness',
    REPORTS: '/app/reports',
    MEDICATIONS: '/app/medications',
    CARE_CIRCLE: '/app/care-circle',
    ASSESSMENT: '/app/assessment',
    LIFESTYLE: '/app/lifestyle',
    TIMELINE: '/app/timeline',
    SETTINGS: '/app/settings',
  },
} as const;
