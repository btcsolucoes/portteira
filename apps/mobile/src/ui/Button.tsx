import { useState } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './Text';
import type { Theme } from './theme';
import { useThemedStyles } from './ThemeProvider';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}: ButtonProps) {
  const { theme, styles } = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const unavailable = disabled || loading;
  const tokens = theme.components.button[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${label}. Em andamento` : label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: unavailable
            ? theme.components.button.disabled.background
            : pressed || focused
              ? tokens.pressed
              : tokens.background,
          borderColor: focused
            ? variant === 'primary'
              ? theme.colors.onPrimary
              : theme.colors.accent
            : variant === 'secondary'
              ? theme.colors.primary
              : theme.colors.transparent,
        },
        style,
      ]}
    >
      <AppText
        variant="label"
        color={unavailable ? theme.components.button.disabled.foreground : tokens.foreground}
        style={styles.label}
      >
        {loading ? `${label}…` : label}
      </AppText>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: theme.components.button.minHeight,
      minWidth: theme.sizes.touch,
      paddingHorizontal: theme.components.button.paddingX,
      paddingVertical: theme.components.button.paddingY,
      borderRadius: theme.components.button.radius,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: { textAlign: 'center' },
  });
