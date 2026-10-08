import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, type SupportedLocale } from './types';
import { getSavedLocale, applyDocumentDirection } from './locale';

// English translation bundles
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enPublic from './locales/en/public.json';
import enAuth from './locales/en/auth.json';
import enOnboarding from './locales/en/onboarding.json';
import enDashboard from './locales/en/dashboard.json';
import enScreening from './locales/en/screening.json';
import enLifestyle from './locales/en/lifestyle.json';
import enLongitudinal from './locales/en/longitudinal.json';
import enReports from './locales/en/reports.json';
import enAppointments from './locales/en/appointments.json';
import enDoctors from './locales/en/doctors.json';
import enCareCircle from './locales/en/careCircle.json';
import enSymptoms from './locales/en/symptoms.json';
import enCycle from './locales/en/cycle.json';
import enMedications from './locales/en/medications.json';
import enSettings from './locales/en/settings.json';
import enChat from './locales/en/chat.json';
import enErrors from './locales/en/errors.json';

// Urdu translation bundles
import urCommon from './locales/ur/common.json';
import urNavigation from './locales/ur/navigation.json';
import urPublic from './locales/ur/public.json';
import urAuth from './locales/ur/auth.json';
import urOnboarding from './locales/ur/onboarding.json';
import urDashboard from './locales/ur/dashboard.json';
import urScreening from './locales/ur/screening.json';
import urLifestyle from './locales/ur/lifestyle.json';
import urLongitudinal from './locales/ur/longitudinal.json';
import urReports from './locales/ur/reports.json';
import urAppointments from './locales/ur/appointments.json';
import urDoctors from './locales/ur/doctors.json';
import urCareCircle from './locales/ur/careCircle.json';
import urSymptoms from './locales/ur/symptoms.json';
import urCycle from './locales/ur/cycle.json';
import urMedications from './locales/ur/medications.json';
import urSettings from './locales/ur/settings.json';
import urChat from './locales/ur/chat.json';
import urErrors from './locales/ur/errors.json';

export const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    public: enPublic,
    auth: enAuth,
    onboarding: enOnboarding,
    dashboard: enDashboard,
    screening: enScreening,
    lifestyle: enLifestyle,
    longitudinal: enLongitudinal,
    reports: enReports,
    appointments: enAppointments,
    doctors: enDoctors,
    careCircle: enCareCircle,
    symptoms: enSymptoms,
    cycle: enCycle,
    medications: enMedications,
    settings: enSettings,
    chat: enChat,
    errors: enErrors,
  },
  ur: {
    common: urCommon,
    navigation: urNavigation,
    public: urPublic,
    auth: urAuth,
    onboarding: urOnboarding,
    dashboard: urDashboard,
    screening: urScreening,
    lifestyle: urLifestyle,
    longitudinal: urLongitudinal,
    reports: urReports,
    appointments: urAppointments,
    doctors: urDoctors,
    careCircle: urCareCircle,
    symptoms: urSymptoms,
    cycle: urCycle,
    medications: urMedications,
    settings: urSettings,
    chat: urChat,
    errors: urErrors,
  },
} as const;

const initialLocale: SupportedLocale = getSavedLocale();

// Apply document direction immediately before React initial mount
applyDocumentDirection(initialLocale);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    fallbackNS: 'common',
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    react: {
      useSuspense: false, // Instant synchronous render
    },
  });

export default i18n;
export * from './types';
export * from './locale';
export * from './terminology';
