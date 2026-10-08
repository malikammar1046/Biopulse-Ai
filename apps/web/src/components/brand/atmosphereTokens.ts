import type { HealthPathway } from '../../types/onboarding';

export type AtmosphereTone =
  | 'neutral'
  | 'female'
  | 'male'
  | 'nutrition'
  | 'movement'
  | 'recovery'
  | 'clinical'
  | 'reports'
  | 'care'
  | 'progress'
  | 'ai'
  | 'privacy'
  | 'education_pcos'
  | 'education_hypogonadism';

export interface AtmosphereDefinition {
  tone: AtmosphereTone;
  /** Primary page background linear gradient */
  baseGradient: string;
  /** Primary soft ambient radial aura top-left / top-right */
  primaryAura: {
    color: string;
    position: string;
    size: string;
  };
  /** Secondary soft ambient radial aura */
  secondaryAura?: {
    color: string;
    position: string;
    size: string;
  };
  /** Motif category to display in margins/negative space */
  motifType:
    | 'botanical_corner'
    | 'herbal_nutrition'
    | 'kinetic_wave'
    | 'cellular_micro'
    | 'reports_rhythm'
    | 'linked_care'
    | 'upward_growth'
    | 'neural_bio'
    | 'ovarian_bio'
    | 'endocrine_bio'
    | 'minimal_privacy'
    | 'none';
  /** Primary motif vector stroke/fill color */
  motifColor: string;
  /** Desktop motif opacity (strictly 0.03 - 0.09) */
  motifOpacity: number;
  /** Mobile motif opacity (reduced to 0.02 - 0.04 to prevent clutter) */
  mobileMotifOpacity: number;
}

export const ATMOSPHERE_TOKENS: Record<AtmosphereTone, AtmosphereDefinition> = {
  // ── 1. Neutral (Public pages, home, overview fallback) ──
  neutral: {
    tone: 'neutral',
    baseGradient: 'linear-gradient(180deg, #FAFCFF 0%, #F7FBFC 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 10% 12%, rgba(207, 250, 254, 0.28) 0%, rgba(224, 242, 254, 0.10) 45%, transparent 70%)',
      position: 'top-0 left-0',
      size: 'w-[45vw] h-[45vh] max-w-[650px] max-h-[500px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 90% 15%, rgba(254, 205, 211, 0.20) 0%, rgba(251, 207, 232, 0.08) 45%, transparent 70%)',
      position: 'top-0 right-0',
      size: 'w-[40vw] h-[45vh] max-w-[600px] max-h-[500px]',
    },
    motifType: 'botanical_corner',
    motifColor: '#0E9EAA',
    motifOpacity: 0.05,
    mobileMotifOpacity: 0.025,
  },

  // ── 2. Female (Cycle, OvaSense settings, female-specific surfaces) ──
  female: {
    tone: 'female',
    baseGradient: 'linear-gradient(180deg, #FFFDFE 0%, #FAF5F8 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 12% 10%, rgba(253, 230, 239, 0.40) 0%, rgba(250, 240, 245, 0.12) 50%, transparent 75%)',
      position: 'top-0 left-0',
      size: 'w-[48vw] h-[48vh] max-w-[680px] max-h-[520px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 88% 20%, rgba(251, 207, 232, 0.24) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[40vw] h-[40vh] max-w-[550px] max-h-[450px]',
    },
    motifType: 'botanical_corner',
    motifColor: '#F43F7D',
    motifOpacity: 0.06,
    mobileMotifOpacity: 0.03,
  },

  // ── 3. Male (AndroSense settings, male-specific surfaces) ──
  male: {
    tone: 'male',
    baseGradient: 'linear-gradient(180deg, #F8FAFD 0%, #F1F6FC 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 88% 10%, rgba(221, 239, 253, 0.45) 0%, rgba(240, 249, 255, 0.15) 50%, transparent 75%)',
      position: 'top-0 right-0',
      size: 'w-[48vw] h-[48vh] max-w-[680px] max-h-[520px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 10% 25%, rgba(186, 230, 253, 0.25) 0%, transparent 65%)',
      position: 'top-0 left-0',
      size: 'w-[40vw] h-[40vh] max-w-[550px] max-h-[450px]',
    },
    motifType: 'botanical_corner',
    motifColor: '#0288D1',
    motifOpacity: 0.06,
    mobileMotifOpacity: 0.03,
  },

  // ── 4. Lifestyle & Nutrition (/app/lifestyle) ──
  nutrition: {
    tone: 'nutrition',
    baseGradient: 'linear-gradient(180deg, #F9FBFA 0%, #F4F8F6 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 12% 10%, rgba(167, 243, 208, 0.28) 0%, rgba(209, 250, 229, 0.10) 45%, transparent 70%)',
      position: 'top-0 left-0',
      size: 'w-[46vw] h-[48vh] max-w-[680px] max-h-[500px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 88% 18%, rgba(204, 251, 241, 0.24) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[42vw] h-[42vh] max-w-[600px] max-h-[460px]',
    },
    motifType: 'herbal_nutrition',
    motifColor: '#059669',
    motifOpacity: 0.065,
    mobileMotifOpacity: 0.03,
  },

  // ── 5. Fitness / Movement (/app/fitness) ──
  movement: {
    tone: 'movement',
    baseGradient: 'linear-gradient(180deg, #F8FAFD 0%, #F2F7FC 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 15% 15%, rgba(186, 230, 253, 0.30) 0%, rgba(224, 242, 254, 0.10) 50%, transparent 70%)',
      position: 'top-0 left-0',
      size: 'w-[50vw] h-[45vh] max-w-[700px] max-h-[480px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 85% 20%, rgba(207, 250, 254, 0.25) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[40vw] h-[40vh] max-w-[580px] max-h-[440px]',
    },
    motifType: 'kinetic_wave',
    motifColor: '#0284C7',
    motifOpacity: 0.055,
    mobileMotifOpacity: 0.025,
  },

  // ── 6. Recovery / Sleep ──
  recovery: {
    tone: 'recovery',
    baseGradient: 'linear-gradient(180deg, #F7F9FC 0%, #F1F4FA 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 18% 12%, rgba(224, 231, 255, 0.35) 0%, rgba(238, 242, 255, 0.12) 50%, transparent 75%)',
      position: 'top-0 left-0',
      size: 'w-[48vw] h-[46vh] max-w-[680px] max-h-[480px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 82% 22%, rgba(219, 234, 254, 0.25) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[40vw] h-[40vh] max-w-[580px] max-h-[440px]',
    },
    motifType: 'kinetic_wave',
    motifColor: '#4338CA',
    motifOpacity: 0.05,
    mobileMotifOpacity: 0.02,
  },

  // ── 7. Assessment & Clinical Screening (/app/assessment, /app/symptoms) ──
  clinical: {
    tone: 'clinical',
    baseGradient: 'linear-gradient(180deg, #FAFCFD 0%, #F5F8FA 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 10% 12%, rgba(207, 250, 254, 0.22) 0%, rgba(224, 242, 254, 0.08) 50%, transparent 75%)',
      position: 'top-0 left-0',
      size: 'w-[45vw] h-[44vh] max-w-[620px] max-h-[460px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 90% 18%, rgba(241, 245, 249, 0.40) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[38vw] h-[38vh] max-w-[520px] max-h-[420px]',
    },
    motifType: 'cellular_micro',
    motifColor: '#0E9EAA',
    motifOpacity: 0.045,
    mobileMotifOpacity: 0.02,
  },

  // ── 8. Health Reports & Labs (/app/reports) ──
  reports: {
    tone: 'reports',
    baseGradient: 'linear-gradient(180deg, #F8FAFC 0%, #F3F6FA 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 85% 10%, rgba(224, 242, 254, 0.25) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[44vw] h-[42vh] max-w-[620px] max-h-[450px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 12% 20%, rgba(241, 245, 249, 0.35) 0%, transparent 65%)',
      position: 'top-0 left-0',
      size: 'w-[38vw] h-[38vh] max-w-[540px] max-h-[400px]',
    },
    motifType: 'reports_rhythm',
    motifColor: '#64748B',
    motifOpacity: 0.035,
    mobileMotifOpacity: 0.018,
  },

  // ── 9. Appointments & Specialists (/app/appointments) ──
  care: {
    tone: 'care',
    baseGradient: 'linear-gradient(180deg, #FAFBFD 0%, #F6F8FB 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 10% 10%, rgba(224, 242, 254, 0.25) 0%, rgba(240, 249, 255, 0.10) 45%, transparent 70%)',
      position: 'top-0 left-0',
      size: 'w-[45vw] h-[45vh] max-w-[640px] max-h-[480px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 90% 18%, rgba(254, 243, 199, 0.15) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[36vw] h-[36vh] max-w-[500px] max-h-[380px]',
    },
    motifType: 'linked_care',
    motifColor: '#0284C7',
    motifOpacity: 0.05,
    mobileMotifOpacity: 0.025,
  },

  // ── 10. Longitudinal Progress (/app/progress, /app/timeline) ──
  progress: {
    tone: 'progress',
    baseGradient: 'linear-gradient(180deg, #F8FAF9 0%, #F3F7F5 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 12% 12%, rgba(209, 250, 229, 0.26) 0%, transparent 65%)',
      position: 'top-0 left-0',
      size: 'w-[46vw] h-[45vh] max-w-[650px] max-h-[480px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 88% 18%, rgba(224, 242, 254, 0.22) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[40vw] h-[40vh] max-w-[580px] max-h-[440px]',
    },
    motifType: 'upward_growth',
    motifColor: '#10B981',
    motifOpacity: 0.055,
    mobileMotifOpacity: 0.025,
  },

  // ── 11. AI Companion & Digital Twin (/app/chat, /app/ai-twin) ──
  ai: {
    tone: 'ai',
    baseGradient: 'linear-gradient(180deg, #F7FAFC 0%, #F2F7FA 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 50% 8%, rgba(207, 250, 254, 0.32) 0%, rgba(224, 242, 254, 0.12) 45%, transparent 70%)',
      position: 'top-0 left-1/2 -translate-x-1/2',
      size: 'w-[60vw] h-[45vh] max-w-[800px] max-h-[480px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 88% 25%, rgba(186, 230, 253, 0.20) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[36vw] h-[36vh] max-w-[520px] max-h-[400px]',
    },
    motifType: 'neural_bio',
    motifColor: '#0891B2',
    motifOpacity: 0.045,
    mobileMotifOpacity: 0.02,
  },

  // ── 12. Trust, Privacy & Compliance (/trust-and-privacy) ──
  privacy: {
    tone: 'privacy',
    baseGradient: 'linear-gradient(180deg, #FAFCFD 0%, #F6F8FB 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 15% 10%, rgba(241, 245, 249, 0.40) 0%, transparent 65%)',
      position: 'top-0 left-0',
      size: 'w-[45vw] h-[42vh] max-w-[620px] max-h-[440px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 85% 15%, rgba(224, 242, 254, 0.18) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[38vw] h-[38vh] max-w-[540px] max-h-[400px]',
    },
    motifType: 'minimal_privacy',
    motifColor: '#475569',
    motifOpacity: 0.035,
    mobileMotifOpacity: 0.015,
  },

  // ── 13. Educational: PCOS (/understand-pcos) ──
  education_pcos: {
    tone: 'education_pcos',
    baseGradient: 'linear-gradient(180deg, #FFFCFD 0%, #FBF4F7 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 10% 12%, rgba(254, 205, 211, 0.32) 0%, rgba(251, 207, 232, 0.10) 50%, transparent 75%)',
      position: 'top-0 left-0',
      size: 'w-[48vw] h-[48vh] max-w-[680px] max-h-[520px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 90% 18%, rgba(207, 250, 254, 0.22) 0%, transparent 65%)',
      position: 'top-0 right-0',
      size: 'w-[40vw] h-[40vh] max-w-[560px] max-h-[440px]',
    },
    motifType: 'ovarian_bio',
    motifColor: '#E11D48',
    motifOpacity: 0.055,
    mobileMotifOpacity: 0.025,
  },

  // ── 14. Educational: Male Hypogonadism (/understand-male-hypogonadism) ──
  education_hypogonadism: {
    tone: 'education_hypogonadism',
    baseGradient: 'linear-gradient(180deg, #F8FAFD 0%, #F1F6FB 50%, #FFFFFF 100%)',
    primaryAura: {
      color: 'radial-gradient(ellipse at 88% 12%, rgba(186, 230, 253, 0.35) 0%, rgba(207, 250, 254, 0.12) 50%, transparent 75%)',
      position: 'top-0 right-0',
      size: 'w-[48vw] h-[48vh] max-w-[680px] max-h-[520px]',
    },
    secondaryAura: {
      color: 'radial-gradient(ellipse at 12% 20%, rgba(224, 242, 254, 0.22) 0%, transparent 65%)',
      position: 'top-0 left-0',
      size: 'w-[40vw] h-[40vh] max-w-[560px] max-h-[440px]',
    },
    motifType: 'endocrine_bio',
    motifColor: '#0284C7',
    motifOpacity: 0.055,
    mobileMotifOpacity: 0.025,
  },
};

/**
 * Explicit list of dashboard route paths where PageAtmosphere is strictly disabled.
 * These dashboards have their own intentional pathway-specific visual identity.
 */
export const DASHBOARD_EXCLUDED_PATHS = new Set<string>([
  '/app',
  '/app/',
  '/app/dashboard',
  '/app/dashboard/',
  '/app/ovasense',
  '/app/ovasense/',
  '/app/androsense',
  '/app/androsense/',
  '/app/vitasense',
  '/app/vitasense/',
]);

/**
 * Checks whether a given path is an excluded dashboard route.
 */
export function isDashboardRoute(pathname: string): boolean {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (DASHBOARD_EXCLUDED_PATHS.has(normalized)) return true;
  if (normalized === '/app') return true;
  return false;
}

/**
 * Resolve the appropriate semantic tone given the pathname and optional pathway.
 */
export function resolveAtmosphereTone(pathname: string, pathway?: HealthPathway | string): AtmosphereTone {
  const path = pathname.toLowerCase().replace(/\/+$/, '');

  // 1. Authenticated Non-Dashboard Routes
  if (path === '/app/lifestyle' || path === '/app/nutrition' || path.startsWith('/app/diet')) {
    return 'nutrition';
  }
  if (path === '/app/fitness') {
    return 'movement';
  }
  if (path === '/app/assessment' || path === '/app/screening' || path === '/app/symptoms') {
    return 'clinical';
  }
  if (path === '/app/reports') {
    return 'reports';
  }
  if (path === '/app/appointments' || path === '/app/care-circle' || path === '/app/carecircle') {
    return 'care';
  }
  if (path === '/app/progress' || path === '/app/timeline' || path === '/app/hub' || path === '/app/master-hub') {
    return 'progress';
  }
  if (
    path === '/app/chat' ||
    path === '/app/ai-twin' ||
    path === '/app/ai' ||
    path === '/app/assistant'
  ) {
    return 'ai';
  }
  if (path === '/app/cycle') {
    return 'female';
  }
  if (path === '/app/settings' || path === '/app/profile') {
    return pathway === 'male' ? 'male' : 'female';
  }

  // 2. Public Educational Routes
  if (
    path === '/understand-pcos' ||
    path === '/understand/pcos' ||
    path === '/health/womens-health'
  ) {
    return 'education_pcos';
  }
  if (
    path === '/understand-male-hypogonadism' ||
    path === '/understand/male-hypogonadism' ||
    path === '/understand-hypogonadism' ||
    path === '/understand/male-fertility' ||
    path === '/health/mens-health'
  ) {
    return 'education_hypogonadism';
  }
  if (path === '/trust-and-privacy') {
    return 'privacy';
  }
  if (path === '/care-circle') {
    return 'care';
  }
  if (path === '/how-it-works' || path === '/ai-that-explains') {
    return 'ai';
  }

  // 3. Fallback default
  if (pathway === 'female') return 'female';
  if (pathway === 'male') return 'male';
  return 'neutral';
}
