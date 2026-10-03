import { Feather } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemedStyles } from './ThemeProvider';
import { useReducedMotionSetting } from './useReducedMotionSetting';
import { AppText } from './Text';
import type { Theme } from './theme';
export type IconButtonProps = {
  name: ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  visibleLabel?: string;
  labelPosition?: 'bottom' | 'right';
};
export function IconButton({
  name,
  label,
  onPress,
  selected,
  disabled = false,
  style,
  visibleLabel,
  labelPosition = 'bottom',
}: IconButtonProps) {
  const { theme, styles } = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotionSetting();
  const foreground = selected ? theme.colors.primary : theme.colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      accessibilityShowsLargeContentViewer
      accessibilityLargeContentTitle={label}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      pressRetentionOffset={16}
      style={[
        styles.base,
        pressed && styles.pressed,
        focused && { borderColor: theme.colors.primary },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          flexDirection: labelPosition === 'right' ? 'row' : 'column',
          gap: 6,
          transform: [{ scale: pressed && !reduced ? 0.97 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: reduced ? 0 : 120,
          transitionTimingFunction: 'ease-out',
        }}
      >
        <Feather
          accessible={false}
          importantForAccessibility="no"
          name={selected && name === 'bookmark' ? 'check' : name}
          size={22}
          color={foreground}
        />
        {visibleLabel && (
          <AppText variant="caption" color={foreground}>
            {visibleLabel}
          </AppText>
        )}
      </Animated.View>
    </Pressable>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minWidth: 48,
      minHeight: 48,
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    pressed: { backgroundColor: theme.colors.subtle },
  });
