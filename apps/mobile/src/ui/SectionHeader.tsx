import { StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { AppText } from './Text';
import type { Theme } from './theme';
import { useThemedStyles } from './ThemeProvider';

export type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
};

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {description ? <AppText color={theme.colors.muted}>{description}</AppText> : null}
      </View>
      {action ? <Button label={action.label} onPress={action.onPress} variant="ghost" /> : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.space.sm,
    },
    copy: { flexGrow: 1, flexShrink: 1, flexBasis: 180, gap: theme.space.xs },
  });
