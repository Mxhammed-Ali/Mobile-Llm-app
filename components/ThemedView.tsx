import { View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColor, useThemeColors, useIsDark } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';
import { GlassStyles, Gradients } from '@/constants/Colors';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'gradient' | 'card';
  gradientType?: 'primary' | 'secondary' | 'accent';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  type = 'default',
  gradientType = 'primary',
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor }, 
    'background'
  );
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { colorScheme } = useTheme();

  // Gradient rendering for gradient type
  if (type === 'gradient') {
    const gradientColors = isDark 
      ? Gradients.dark[gradientType]
      : Gradients.light[gradientType];

    return (
      <LinearGradient
        colors={gradientColors as any}
        style={[{ backgroundColor }, style]}
        {...otherProps}
      />
    );
  }

  // Default themed view
  return (
    <View 
      style={[
        { backgroundColor },
        type === 'card' && {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          borderRadius: 12,
        },
        style
      ]} 
      {...otherProps} 
    />
  );
} 