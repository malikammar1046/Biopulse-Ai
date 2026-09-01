export const ROUTES = {
  // Public Marketing Routes
  HOME: '/',
  ABOUT: '/about',
  UNDERSTAND_PCOS: '/understand-pcos',
  HOW_IT_WORKS: '/how-it-works',
  FEATURES: '/features',
  CARE_CIRCLE: '/care-circle',
  CARE_PROVIDER_PORTAL: '/care-provider/:token',
  CONTACT: '/contact',

  // Authentication & Onboarding Routes
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',

  // Authenticated App Routes
  APP: {
    ROOT: '/app',
    DASHBOARD: '/app/dashboard',
    AI_TWIN: '/app/ai-twin',
    CHAT: '/app/chat',
    PROFILE: '/app/profile',
    CYCLE: '/app/cycle',
    SYMPTOMS: '/app/symptoms',
    DIET: '/app/diet',
    DIET_WEEK: '/app/diet/week',
    FITNESS: '/app/fitness',
    REPORTS: '/app/reports',
    MEDICATIONS: '/app/medications',
    CARE_CIRCLE: '/app/care-circle',
    APPOINTMENTS: '/app/appointments',
    ASSESSMENT: '/app/assessment',
    LIFESTYLE: '/app/lifestyle',
    TIMELINE: '/app/timeline',
    SETTINGS: '/app/settings',
  },
} as const;
