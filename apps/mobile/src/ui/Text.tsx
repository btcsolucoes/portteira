import { Text, type TextProps } from 'react-native';
import { typography } from './theme';
import { useTheme } from './ThemeProvider';
export type AppTextProps = TextProps & { variant?: keyof typeof typography; color?: string };
export function AppText({ variant = 'body', color, style, ...props }: AppTextProps) {
  const { theme } = useTheme();
  return (
    <Text
      allowFontScaling
      {...props}
      style={[
        theme.typography[variant],
        { color: color ?? theme.colors.text, flexShrink: 1 },
        style,
      ]}
    />
  );
}
