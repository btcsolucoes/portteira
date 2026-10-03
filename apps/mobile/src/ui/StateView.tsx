import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { AppText } from './Text';
import type { Theme } from './theme';
import { useThemedStyles } from './ThemeProvider';

export type StateViewProps = {
  kind: 'empty' | 'error' | 'loading';
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
};

export function StateView({ kind, title, description, action }: StateViewProps) {
  const { theme, styles } = useThemedStyles(createStyles);
  useEffect(() => {
    if (kind === 'error' && Platform.OS === 'ios')
      AccessibilityInfo.announceForAccessibility(`${title}. ${description ?? ''}`);
  }, [kind, title, description]);

  return (
    <View style={styles.container}>
      {kind === 'loading' ? (
        <View style={styles.skeletons}>
          <Skeleton width="62%" height={theme.space.lg} />
          <Skeleton />
          <Skeleton width="84%" />
        </View>
      ) : (
        <Feather
          accessible={false}
          importantForAccessibility="no"
          name={kind === 'error' ? 'alert-circle' : 'search'}
          size={theme.space.xl}
          color={kind === 'error' ? theme.colors.danger : theme.colors.muted}
        />
      )}
      <AppText
        variant="heading"
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
        accessibilityState={{ busy: kind === 'loading' }}
      >
        {title}
      </AppText>
      {description ? <AppText color={theme.colors.muted}>{description}</AppText> : null}
      {action && kind !== 'loading' ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="secondary"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.space.lg, gap: theme.space.md, alignItems: 'flex-start' },
    skeletons: { alignSelf: 'stretch', gap: theme.space.md, marginBottom: theme.space.sm },
    action: { alignSelf: 'flex-start' },
  });
