export const ROUTES = {
  // Public Marketing Routes
  HOME: '/',
  ABOUT: '/about',
  HOW_IT_WORKS: '/how-it-works',
  FEATURES: '/features',
  CONTACT: '/contact',

  // Authentication Routes
  LOGIN: '/login',
  REGISTER: '/register',

  // Future Authenticated App Routes
  APP: {
    ROOT: '/app',
    DASHBOARD: '/app/dashboard',
    PROFILE: '/app/profile',
    CYCLE: '/app/cycle',
    SYMPTOMS: '/app/symptoms',
    REPORTS: '/app/reports',
    ASSESSMENT: '/app/assessment',
    LIFESTYLE: '/app/lifestyle',
    TIMELINE: '/app/timeline',
    SETTINGS: '/app/settings',
  },
} as const;
