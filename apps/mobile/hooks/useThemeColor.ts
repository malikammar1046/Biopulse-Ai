import { useColorScheme } from 'react-native';
import { Colors, ColorTheme } from '../constants/Colors';

/**
 * Returns the current color scheme palette based on system preference or default dark theme.
 */
export function useThemeColor(): ColorTheme {
  const colorScheme = useColorScheme();
  return colorScheme === 'light' ? Colors.light : Colors.dark;
}
