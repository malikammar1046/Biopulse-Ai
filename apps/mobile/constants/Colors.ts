/**
 * PMOSense Theme Palette
 * Curated dark & light color tokens with accessible contrast for health monitoring.
 */

export interface ColorTheme {
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  border: string;
  borderFocus: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  teal: string;
  amber: string;
  rose: string;
  card: string;
  cardBorder: string;
}

export const Colors: { dark: ColorTheme; light: ColorTheme } = {
  dark: {
    background: '#090d16',
    surface: '#0f172a',
    surfaceSubtle: '#1e293b',
    surfaceElevated: '#1e2238',
    border: '#1e293b',
    borderFocus: '#7c3aed',
    
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    
    // Health & Status Accents
    primary: '#a855f7',       // PMOSense Purple
    primaryLight: '#c084fc',
    primaryDark: '#7e22ce',
    
    secondary: '#ec4899',     // Cycle / Wellness Pink
    teal: '#14b8a6',          // Metrics / Stable Status
    amber: '#f59e0b',         // Advisory / Warning
    rose: '#f43f5e',          // Symptom Flag
    
    card: '#0f172a',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
  },
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9',
    surfaceElevated: '#ffffff',
    border: '#e2e8f0',
    borderFocus: '#8b5cf6',
    
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    
    primary: '#9333ea',
    primaryLight: '#a855f7',
    primaryDark: '#6b21a8',
    
    secondary: '#db2777',
    teal: '#0d9488',
    amber: '#d97706',
    rose: '#e11d48',
    
    card: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
  },
};

export type ColorKey = keyof ColorTheme;
