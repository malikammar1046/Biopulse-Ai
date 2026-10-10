import i18n from 'i18next';
import {
  type SupportedLocale,
  type LocaleDirection,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  STORAGE_LOCALE_KEY,
  STORAGE_LOCALE_SELECTED_KEY,
  isRtlLocale,
} from './types';

/**
 * Validates whether an arbitrary string is a valid SupportedLocale.
 */
export function isValidLocale(val: unknown): val is SupportedLocale {
  return typeof val === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(val);
}

/**
 * Retrieves the currently persisted or default locale.
 */
export function getSavedLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const saved = localStorage.getItem(STORAGE_LOCALE_KEY);
    if (saved && isValidLocale(saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }

  return DEFAULT_LOCALE;
}

/**
 * Checks if the user has explicitly selected a language on this device before.
 */
export function hasUserSelectedLocale(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(STORAGE_LOCALE_SELECTED_KEY) === 'true';
  } catch {
    return true;
  }
}

/**
 * Marks that the user has completed the first-visit language choice.
 */
export function markLocaleAsSelected(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_LOCALE_SELECTED_KEY, 'true');
  } catch {
    // Ignore
  }
}

/**
 * Synchronizes HTML document attributes (lang and dir) with the given locale.
 */
export function applyDocumentDirection(locale: SupportedLocale): void {
  if (typeof document === 'undefined') return;

  const isRTL = isRtlLocale(locale);
  const dir: LocaleDirection = isRTL ? 'rtl' : 'ltr';

  document.documentElement.lang = locale;
  document.documentElement.dir = dir;

  if (isRTL) {
    document.documentElement.classList.add('rtl-mode');
    document.documentElement.classList.remove('ltr-mode');
  } else {
    document.documentElement.classList.add('ltr-mode');
    document.documentElement.classList.remove('rtl-mode');
  }
}

/**
 * Switches the global application locale in i18next, localStorage, and the DOM.
 */
export async function changeLocale(locale: SupportedLocale, markSelected = true): Promise<void> {
  if (!isValidLocale(locale)) return;

  try {
    localStorage.setItem(STORAGE_LOCALE_KEY, locale);
    if (markSelected) {
      localStorage.setItem(STORAGE_LOCALE_SELECTED_KEY, 'true');
    }
  } catch {
    // Ignore storage issues
  }

  applyDocumentDirection(locale);

  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }

  // Dispatch custom window event so non-React components or listeners can sync
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('biopulse:localeChanged', { detail: { locale } }));
  }
}
