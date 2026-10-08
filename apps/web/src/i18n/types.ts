export type SupportedLocale = 'en' | 'ur';

export type LocaleDirection = 'ltr' | 'rtl';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'ur'] as const;

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const RTL_LOCALES: readonly SupportedLocale[] = ['ur'] as const;

export const STORAGE_LOCALE_KEY = 'biopulse_locale';
export const STORAGE_LOCALE_SELECTED_KEY = 'biopulse_locale_selected';

export function isRtlLocale(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

export type I18nNamespace =
  | 'common'
  | 'navigation'
  | 'public'
  | 'auth'
  | 'onboarding'
  | 'dashboard'
  | 'screening'
  | 'lifestyle'
  | 'longitudinal'
  | 'reports'
  | 'appointments'
  | 'doctors'
  | 'careCircle'
  | 'symptoms'
  | 'cycle'
  | 'medications'
  | 'settings'
  | 'chat'
  | 'errors';
