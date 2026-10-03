import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Badge, Button, StateView, useThemedStyles, type Theme } from '@/ui';

export function DetailPage({
  title,
  description,
  children,
  showDemoBadge = true,
}: {
  title: string;
  description?: string;
  showDemoBadge?: boolean;
  children: React.ReactNode;
}) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {showDemoBadge && <Badge label="Dados fictícios" />}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {description && <AppText color={theme.colors.muted}>{description}</AppText>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}
export function DetailFact({ label, value }: { label: string; value: string }) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.fact}>
      <AppText variant="caption" color={theme.colors.muted}>
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
export function MissingDetail({
  type,
  fallbackHref,
  fallbackLabel,
}: {
  type: string;
  fallbackHref: Href;
  fallbackLabel: string;
}) {
  return (
    <DetailPage title={`${type} não encontrado`}>
      <StateView
        kind="empty"
        title="Este conteúdo não está disponível"
        description="O endereço pode estar incorreto ou não fazer parte desta demonstração."
      />
      <Button
        label={fallbackLabel}
        variant="secondary"
        onPress={() => (router.canGoBack() ? router.back() : router.replace(fallbackHref))}
      />
    </DetailPage>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    container: {
      width: '100%',
      maxWidth: theme.sizes.contentMax,
      alignSelf: 'center',
      padding: theme.space.md,
      paddingBottom: theme.space.xl,
      gap: theme.space.md,
    },
    section: { gap: theme.space.sm, paddingTop: theme.space.md },
    fact: {
      gap: theme.space.xs,
      paddingVertical: theme.space.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
  });
