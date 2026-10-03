import { StyleSheet, View } from 'react-native';
import { AppText } from './Text';
import type { Theme } from './theme';
import { useThemedStyles } from './ThemeProvider';

export type BadgeProps = { label: string; tone?: 'neutral' | 'accent' | 'success' };

/** A textual status, never an unlabeled color dot or an interactive filter. */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { theme, styles } = useThemedStyles(createStyles);
  const tones = {
    neutral: { background: theme.colors.subtle, foreground: theme.colors.muted },
    accent: { background: theme.colors.accentSubtle, foreground: theme.colors.accentText },
    success: { background: theme.colors.subtle, foreground: theme.colors.primary },
  };
  return (
    <View style={[styles.base, { backgroundColor: tones[tone].background }]}>
      <AppText variant="caption" color={tones[tone].foreground}>
        {label}
      </AppText>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      maxWidth: '100%',
      alignSelf: 'flex-start',
      paddingHorizontal: theme.space.sm,
      paddingVertical: theme.space.xs,
      borderRadius: theme.radius.sm,
    },
  });
