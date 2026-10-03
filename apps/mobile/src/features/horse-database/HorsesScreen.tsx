import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { type Breed, type Horse } from '@equestre/domain';
import { BreedFilters, BrowseHeader, DemoFooter } from '@/components/BrowseHeader';
import { AppText, Screen, StateView, useThemedStyles, type Theme } from '@/ui';
import { HorseResultCard } from './HorseResultCard';
import { horseProvider } from './provider';

export default function HorsesScreen() {
  const { theme, styles } = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [breed, setBreed] = useState<Breed>();
  const [result, setResult] = useState<{
    key: string;
    items: Horse[];
    status: 'ready' | 'error';
  }>();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([query, breed, attempt]);
  const status = result?.key === key ? result.status : 'loading';
  const items = result?.key === key ? result.items : [];
  useEffect(() => {
    const controller = new AbortController();
    horseProvider
      .search({ query, breed, limit: 50 }, { signal: controller.signal })
      .then((page) => {
        if (!controller.signal.aborted) setResult({ key, items: page.items, status: 'ready' });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, items: [], status: 'error' });
      });
    return () => controller.abort();
  }, [query, breed, key]);
  return (
    <Screen>
      <FlatList
        data={status === 'ready' ? items : []}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <HorseResultCard horse={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <BrowseHeader
            title="Cada cavalo, uma história"
            description="Pesquise registros, origens e genealogias."
            query={query}
            onQueryChange={setQuery}
            searchLabel="Nome ou número de registro"
            placeholder="Busque um cavalo"
          >
            <BreedFilters value={breed} onChange={setBreed} />
            <View style={styles.notice}>
              <AppText variant="label" color={theme.colors.primary}>
                Pesquisa independente
              </AppText>
              <AppText variant="caption" color={theme.colors.muted}>
                Explore fichas fictícias. As bases das associações ainda não estão conectadas.
              </AppText>
            </View>
            {status === 'ready' && (
              <AppText variant="label" accessibilityLiveRegion="polite">
                {items.length} cavalos encontrados
              </AppText>
            )}
          </BrowseHeader>
        }
        ListEmptyComponent={
          status === 'loading' ? (
            <StateView kind="loading" title="Consultando cavalos" />
          ) : status === 'error' ? (
            <StateView
              kind="error"
              title="A consulta não foi concluída"
              description="Tente consultar novamente."
              action={{ label: 'Tentar novamente', onPress: () => setAttempt((a) => a + 1) }}
            />
          ) : (
            <StateView
              kind="empty"
              title="Nenhum cavalo encontrado"
              description="Revise o nome, o registro ou a raça selecionada."
              action={{
                label: 'Limpar filtros',
                onPress: () => {
                  setQuery('');
                  setBreed(undefined);
                },
              }}
            />
          )
        }
        ListFooterComponent={<DemoFooter />}
      />
    </Screen>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { paddingHorizontal: theme.space.md, paddingBottom: theme.space.md },
    separator: { height: theme.space.md },
    notice: {
      gap: theme.space.xs,
      padding: theme.space.md,
      backgroundColor: theme.colors.subtle,
      borderRadius: theme.radius.md,
    },
  });
