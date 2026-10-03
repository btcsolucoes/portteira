import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import type { Theme } from './theme';
import { useThemedStyles } from './ThemeProvider';

export type ScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
}>;

/** Root tabs own the bottom inset. Lists own their scroll container and gutters. */
export function Screen({
  children,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.components.screen.background },
    content: {
      flex: 1,
      width: '100%',
      maxWidth: theme.components.screen.maxWidth,
      alignSelf: 'center',
    },
  });
