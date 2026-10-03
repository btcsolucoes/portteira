import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, useThemedStyles, type Theme } from '@/ui';

export function ResultCard({
  href,
  label,
  children,
}: {
  href: Href;
  label: string;
  children: React.ReactNode;
}) {
  const { theme, styles } = useThemedStyles(createStyles);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={StyleSheet.flatten([
          styles.card,
          pressed && styles.pressed,
          focused && { borderColor: theme.colors.accent },
        ])}
      >
        {children}
      </Pressable>
    </Link>
  );
}
export function Metadata({
  icon,
  children,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  children: string;
}) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.metadata}>
      <Feather name={icon} color={theme.colors.muted} size={16} />
      <AppText variant="caption" color={theme.colors.muted} style={styles.metadataText}>
        {children}
      </AppText>
    </View>
  );
}
export const cardStyles = StyleSheet.create({
  content: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  grow: { flex: 1, gap: 4 },
  divider: { height: 16 },
});
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    },
    pressed: { opacity: 0.75 },
    metadata: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
    metadataText: { flex: 1 },
  });
