import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Theme } from './theme';
import { useThemedStyles } from './ThemeProvider';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/** Static placeholders avoid motion and reserve the loaded content's space. */
export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { width, height }, style]}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      backgroundColor: theme.components.skeleton.background,
      borderRadius: theme.components.skeleton.radius,
    },
  });
