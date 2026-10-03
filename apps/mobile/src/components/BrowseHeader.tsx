import { StyleSheet, View } from 'react-native';
import { BREEDS, type Breed } from '@equestre/domain';
import { AppText, Chip, SearchField, ThemeToggle, useThemedStyles, type Theme } from '@/ui';
export function BrandHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.brand}>
      <View style={{ flex: 1 }}>
        <AppText
          variant={title ? 'title' : 'heading'}
          accessibilityRole="header"
          color={theme.colors.primary}
          style={!title ? styles.wordmark : undefined}
        >
          {title ?? 'equestre.'}
        </AppText>
        {subtitle && (
          <AppText variant="metadata" color={theme.colors.muted}>
            {subtitle}
          </AppText>
        )}
      </View>
      {!title && (
        <AppText variant="metadata" color={theme.colors.muted}>
          COMUNIDADE
        </AppText>
      )}
      <ThemeToggle />
    </View>
  );
}
export function BrowseHeader({
  title,
  description,
  query,
  onQueryChange,
  searchLabel,
  placeholder,
  children,
}: {
  title: string;
  description: string;
  query?: string;
  onQueryChange?: (value: string) => void;
  searchLabel?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <BrandHeader title={title} />
      <AppText variant="caption" color={theme.colors.muted}>
        {description}
      </AppText>
      {onQueryChange && (
        <SearchField
          label={searchLabel ?? 'Buscar'}
          value={query ?? ''}
          onChangeText={onQueryChange}
          placeholder={placeholder}
        />
      )}
      {children}
    </View>
  );
}
export function BreedFilters({
  value,
  onChange,
}: {
  value?: Breed;
  onChange: (breed?: Breed) => void;
}) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.chips}>
      <Chip label="Todas as raças" selected={!value} onPress={() => onChange(undefined)} />
      {BREEDS.map((breed) => (
        <Chip
          key={breed.id}
          label={breed.label}
          selected={value === breed.id}
          onPress={() => onChange(breed.id)}
        />
      ))}
    </View>
  );
}
export function DemoFooter() {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <AppText variant="caption" color={theme.colors.muted} style={styles.footer}>
      Conteúdo fictício · curtidas e salvos nesta sessão.
    </AppText>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: 12, paddingBottom: 16 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 64 },
    wordmark: { fontFamily: 'Georgia', fontSize: 29, lineHeight: 36, letterSpacing: -1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    footer: { textAlign: 'center', padding: 24, lineHeight: 20 },
  });
