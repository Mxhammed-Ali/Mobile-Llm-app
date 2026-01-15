/**
 * Enhanced theme color hooks supporting light, dark, and liquid glass themes
 */

import { Colors, ColorScheme } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string }, 
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { colorScheme } = useTheme();
  const colorFromProps = props[colorScheme as 'light' | 'dark'];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorScheme as 'light' | 'dark'][colorName];
  }
}

// Hook to get current theme colors
export function useThemeColors() {
  const { colorScheme } = useTheme();
  return Colors[colorScheme as 'light' | 'dark'];
}

// Hook to check if current theme is dark
export function useIsDark() {
  const { colorScheme } = useTheme();
  return colorScheme === 'dark';
}
