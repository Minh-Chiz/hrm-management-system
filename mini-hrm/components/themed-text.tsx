import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type TextVariant =
  | 'default'
  | 'title'
  | 'subtitle'
  | 'defaultSemiBold'
  | 'semiBold'
  | 'bold'
  | 'caption'
  | 'link';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: TextVariant;
  variant?: TextVariant; // Alias for type for standard component conventions
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  variant,
  ...rest
}: ThemedTextProps) {
  const activeType = variant || type;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const getStyleForType = () => {
    switch (activeType) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'defaultSemiBold':
      case 'semiBold':
        return styles.semiBold;
      case 'bold':
        return styles.bold;
      case 'caption':
        return styles.caption;
      case 'link':
        return styles.link;
      case 'default':
      default:
        return styles.default;
    }
  };

  return (
    <Text
      style={[{ color }, getStyleForType(), style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  semiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  bold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0a7ea4',
  },
});
