import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './Text';
import type { Theme } from './theme';
import { useThemedStyles } from './ThemeProvider';

export type ChipProps = {
  label: string;
  selected?: boolean;
  expanded?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Chip({
  label,
  selected = false,
  expanded,
  onPress,
  disabled = false,
  style,
}: ChipProps) {
  const { theme, styles } = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const foreground = selected
    ? theme.components.chip.selectedForeground
    : theme.components.chip.foreground;
  const content = (
    <>
      {selected ? (
        <Feather
          accessible={false}
          importantForAccessibility="no"
          name="check"
          size={theme.sizes.iconSmall}
          color={foreground}
        />
      ) : null}
      <AppText variant="label" color={foreground}>
        {label}
      </AppText>
    </>
  );
  const commonStyle = [styles.base, selected && styles.selected, style];
  if (!onPress) return <View style={commonStyle}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: expanded === undefined ? selected : undefined,
        expanded,
        disabled,
      }}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      style={({ pressed }) => [
        commonStyle,
        pressed && {
          backgroundColor: selected ? theme.colors.primaryPressed : theme.colors.subtle,
        },
        focused && { borderColor: selected ? theme.colors.onPrimary : theme.colors.primary },
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: theme.sizes.touch,
      minWidth: theme.sizes.touch,
      maxWidth: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.space.xs,
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.sm,
      backgroundColor: theme.components.chip.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
    },
    selected: {
      backgroundColor: theme.components.chip.selectedBackground,
      borderColor: theme.colors.primary,
    },
    disabled: { opacity: 0.5 },
  });
