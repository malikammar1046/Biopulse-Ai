import { useColorScheme } from 'react-native';
import { Colors, ColorTheme } from '../constants/Colors';

export interface UseThemeResult {
  theme: ColorTheme;
  colorScheme: 'light' | 'dark';
  isDark: boolean;
}

/**
 * Returns the current active ColorTheme and scheme metadata.
 * Can be called without arguments to get the entire theme, or with a specific ColorKey.
 */
export function useTheme(): UseThemeResult {
  const systemScheme = useColorScheme();
  const colorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const theme = Colors[colorScheme];

  return {
    theme,
    colorScheme,
    isDark: colorScheme === 'dark',
  };
}

/**
 * Convenience hook returning the active ColorTheme directly.
 */
export function useThemeColor(): ColorTheme {
  const { theme } = useTheme();
  return theme;
}
