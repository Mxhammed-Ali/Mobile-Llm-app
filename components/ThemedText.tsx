import { Text, type TextProps } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColor, useThemeColors } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/ThemeContext';
import { Gradients } from '@/constants/Colors';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'gradient';
  gradientType?: 'primary' | 'secondary' | 'accent';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  gradientType = 'primary',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor(
    { light: lightColor, dark: darkColor }, 
    'text'
  );
  const colors = useThemeColors();
  const { colorScheme } = useTheme();
  
  // Add error handling for colors
  if (!colors) {
    console.error('Colors are undefined in ThemedText');
    return (
      <Text
        style={[{ color: '#000000', fontSize: 16, lineHeight: 24 }, style]}
        {...rest}
      />
    );
  }

  // Gradient text rendering
  if (type === 'gradient') {
    const gradientColors = colorScheme === 'dark' 
      ? Gradients.dark[gradientType]
      : Gradients.light[gradientType];

    // Ensure gradientColors is a valid array
    if (!gradientColors || gradientColors.length < 2) {
      console.error('Invalid gradient colors:', gradientColors);
      return (
        <Text
          style={[{ color: '#000000', fontSize: 16, lineHeight: 24 }, style]}
          {...rest}
        />
      );
    }

    return (
      <MaskedView
        maskElement={
          <Text
            style={[{ fontSize: 16, lineHeight: 24 }, style]}
            {...rest}
          />
        }
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </MaskedView>
    );
  }

  // Regular themed text with basic styling
  const textStyle: any = { color, fontSize: 16, lineHeight: 24 };

  if (type === 'title') {
    textStyle.fontSize = 32;
    textStyle.fontWeight = 'bold';
    textStyle.lineHeight = 32;
  } else if (type === 'defaultSemiBold') {
    textStyle.fontWeight = '600';
  } else if (type === 'subtitle') {
    textStyle.fontSize = 20;
    textStyle.fontWeight = 'bold';
  } else if (type === 'link') {
    textStyle.lineHeight = 30;
    textStyle.color = colors.tint;
  }

  return (
    <Text
      style={[textStyle, style]}
      {...rest}
    />
  );
} 