import { useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  BREEDS,
  LISTING_CATEGORIES,
  filterListings,
  rankListings,
  preserveListingOrder,
  type ListingCategory,
  type Breed,
  type MarketplaceListing,
} from '@equestre/domain';
import { OptionSheet } from '@/components/OptionSheet';
import { StatePicker, STATE_NAMES, type BrazilState } from '@/components/StatePicker';
import {
  AppText,
  Button,
  Chip,
  Screen,
  SearchField,
  StateView,
  useThemedStyles,
  type Theme,
} from '@/ui';
import { useMarketplace } from '@/providers/MarketplaceProvider';
import { breedLabel } from '@/lib/format';
import { MarketplaceCard } from './MarketplaceCard';
import { BrandLogo } from '@/components/BrandLogo';

type Sort = 'recommended' | 'recent' | 'low' | 'high';
type Mode = 'browse' | 'favorites' | 'mine';

export default function MarketplaceScreen({ mode = 'browse' }: { mode?: Mode }) {
  const { ready, state } = useMarketplace();
  // Wait for storage before taking a reading-order snapshot. Only explicit preference
  // changes start a new feed; a view or favorite must not move content under a finger.
  return ready ? (
    <MarketplaceFeed key={JSON.stringify(state.preferences)} mode={mode} />
  ) : (
    <Screen>
      <StateView kind="empty" title="Carregando anúncios" description="Só um instante…" />
    </Screen>
  );
}

function MarketplaceFeed({ mode }: { mode: Mode }) {
  const { theme, styles } = useThemedStyles(createStyles);
  const { listings, state, storageError, retryLoad, dismissListing, restoreHidden } =
    useMarketplace();
  const listRef = useRef<FlatList<MarketplaceListing>>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ListingCategory>();
  const [breed, setBreed] = useState<Breed>();
  const [region, setRegion] = useState<BrazilState>();
  const [sort, setSort] = useState<Sort>(
    mode === 'browse' && state.preferences.personalized ? 'recommended' : 'recent',
  );
  const [sheet, setSheet] = useState<'filters' | 'sort'>();
  const [draftCategory, setDraftCategory] = useState<ListingCategory>();
  const [draftBreed, setDraftBreed] = useState<Breed>();
  const [draftRegion, setDraftRegion] = useState<BrazilState>();
  const [hiddenId, setHiddenId] = useState<string>();
  const [notice, setNotice] = useState('');
  const ranked = useMemo(
    () =>
      rankListings(
        listings.filter((item) => item.status === 'active'),
        {
          preferences: state.preferences,
          events: state.events,
          now: new Date().toISOString(),
        },
      ),
    [listings, state.preferences, state.events],
  );
  const catalogKey = JSON.stringify(listings.map((item) => item.id));
  const [readingSnapshot, setReadingSnapshot] = useState(() => ({
    catalogKey,
    ids: preserveListingOrder(
      ranked.map((item) => item.listing.id),
      listings,
    ).map((item) => item.id),
  }));
  // Track the complete catalog, including hidden/paused entries. Incorporate new IDs
  // once, so subsequent behavioral signals cannot move those entries either.
  if (readingSnapshot.catalogKey !== catalogKey) {
    setReadingSnapshot({
      catalogKey,
      ids: preserveListingOrder(readingSnapshot.ids, listings).map((item) => item.id),
    });
  }
  const reasons = new Map(ranked.map((item) => [item.listing.id, item.reason]));
  const source =
    mode === 'mine'
      ? listings.filter((item) => item.provenance.kind === 'local')
      : mode === 'favorites'
        ? listings.filter((item) => state.favoriteIds.includes(item.id))
        : preserveListingOrder(
            readingSnapshot.ids,
            ranked.map((item) => item.listing),
          );
  const items = filterListings(source, { query, category, breed }).filter(
    (item) => !region || item.location.state === region,
  );
  if (sort !== 'recommended' || mode !== 'browse')
    items.sort((a, b) => {
      if (sort === 'recent' || sort === 'recommended')
        return b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id);
      if (a.priceInCents === null) return b.priceInCents === null ? a.id.localeCompare(b.id) : 1;
      if (b.priceInCents === null) return -1;
      return (
        (sort === 'low' ? a.priceInCents - b.priceInCents : b.priceInCents - a.priceInCents) ||
        a.id.localeCompare(b.id)
      );
    });
  const sortOptions: { id: Sort; label: string }[] = [
    ...(mode === 'browse' && state.preferences.personalized
      ? [{ id: 'recommended' as const, label: 'Para você' }]
      : []),
    { id: 'recent', label: 'Mais recentes' },
    { id: 'low', label: 'Menor preço' },
    { id: 'high', label: 'Maior preço' },
  ];
  const filtered = Boolean(query || category || breed || region);
  function clear() {
    setQuery('');
    setCategory(undefined);
    setBreed(undefined);
    setRegion(undefined);
  }
  function refresh() {
    setReadingSnapshot({
      catalogKey,
      ids: preserveListingOrder(
        ranked.map((item) => item.listing.id),
        listings,
      ).map((item) => item.id),
    });
    setNotice('Sugestões atualizadas.');
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }
  async function hide(id: string) {
    try {
      await dismissListing(id);
      setHiddenId(id);
      setNotice('');
    } catch {
      /* Provider displays the storage error. */
    }
  }
  async function undo() {
    try {
      await restoreHidden(hiddenId);
      setHiddenId(undefined);
    } catch {
      /* Keep undo available on failure. */
    }
  }
  return (
    <Screen>
      <View style={styles.brand}>
        {mode === 'browse' ? (
          <BrandLogo />
        ) : (
          <AppText
            variant="title"
            accessibilityRole="header"
            color={theme.colors.primary}
            style={{ flex: 1 }}
          >
            {mode === 'favorites' ? 'Favoritos' : 'Meus anúncios'}
          </AppText>
        )}
        <Button label="Anunciar" onPress={() => router.push('/marketplace/create')} />
      </View>
      {hiddenId && (
        <View style={styles.feedback}>
          <AppText style={{ flex: 1 }} accessibilityLiveRegion="polite">
            Anúncio oculto.
          </AppText>
          <Button
            variant="ghost"
            label="Desfazer"
            onPress={() => {
              void undo();
            }}
          />
        </View>
      )}
      <FlatList
        ref={listRef}
        showsVerticalScrollIndicator={false}
        data={items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <MarketplaceCard
            listing={item}
            reason={mode === 'browse' && sort === 'recommended' ? reasons.get(item.id) : undefined}
            allowDismiss={mode === 'browse'}
            onDismiss={(id) => {
              void hide(id);
            }}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            {storageError && (
              <StateView
                kind="error"
                title="Não foi possível guardar a alteração"
                description={storageError}
                action={{ label: 'Tentar novamente', onPress: retryLoad }}
              />
            )}
            <SearchField
              hideLabel
              label="Buscar anúncios"
              placeholder="O que você procura?"
              value={query}
              onChangeText={setQuery}
            />
            <View style={styles.toolbar}>
              <Button
                style={{ flex: 1 }}
                variant="secondary"
                label={'Filtrar' + (category || breed || region ? ' · ativo' : '')}
                onPress={() => {
                  setDraftCategory(category);
                  setDraftBreed(breed);
                  setDraftRegion(region);
                  setSheet('filters');
                }}
              />
              <Button
                style={{ flex: 1 }}
                variant="secondary"
                label="Ordenar"
                onPress={() => setSheet('sort')}
              />
            </View>
            {(category || breed || region) && (
              <View style={styles.chips}>
                {category && (
                  <Chip
                    label={`${LISTING_CATEGORIES.find((item) => item.id === category)?.label} ×`}
                    onPress={() => setCategory(undefined)}
                  />
                )}
                {breed && (
                  <Chip label={breedLabel(breed) + ' ×'} onPress={() => setBreed(undefined)} />
                )}
                {region && (
                  <Chip label={STATE_NAMES[region] + ' ×'} onPress={() => setRegion(undefined)} />
                )}
              </View>
            )}
            <AppText variant="caption" color={theme.colors.muted} accessibilityLiveRegion="polite">
              {items.length} {items.length === 1 ? 'anúncio' : 'anúncios'} ·{' '}
              {sortOptions.find((option) => option.id === sort)?.label ?? 'Mais recentes'}
            </AppText>
            {!!notice && (
              <AppText variant="caption" accessibilityLiveRegion="polite">
                {notice}
              </AppText>
            )}
          </View>
        }
        ListEmptyComponent={
          <StateView
            kind="empty"
            title={
              filtered
                ? 'Nenhum anúncio nesta busca'
                : mode === 'mine'
                  ? 'Crie seu primeiro anúncio'
                  : mode === 'favorites'
                    ? 'Seus favoritos ficam aqui'
                    : 'Nenhum anúncio por aqui'
            }
            description={
              filtered
                ? 'Tente outra palavra ou retire os filtros.'
                : mode === 'mine'
                  ? 'Vamos ajudar você a preencher, uma etapa por vez.'
                  : mode === 'favorites'
                    ? 'Toque em Favoritar nos anúncios que você gostar.'
                    : 'Você pode voltar a mostrar os anúncios que ocultou.'
            }
            action={{
              label: filtered
                ? 'Limpar busca e filtros'
                : mode === 'mine'
                  ? 'Criar anúncio'
                  : mode === 'favorites'
                    ? 'Ver anúncios'
                    : 'Mostrar anúncios ocultos',
              onPress: filtered
                ? clear
                : mode === 'mine'
                  ? () => router.push('/marketplace/create')
                  : mode === 'favorites'
                    ? () => router.navigate('/marketplace')
                    : () => {
                        void restoreHidden().catch(() => undefined);
                      },
            }}
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {mode === 'browse' && items.length > 0 && sort === 'recommended' && (
              <Button variant="secondary" label="Atualizar sugestões" onPress={refresh} />
            )}
            <AppText variant="caption" color={theme.colors.muted} style={{ textAlign: 'center' }}>
              Prévia local · exemplos e anúncios deste aparelho.
            </AppText>
          </View>
        }
      />
      <OptionSheet
        visible={sheet === 'filters'}
        title="Filtrar anúncios"
        onClose={() => setSheet(undefined)}
      >
        <AppText variant="label">O que você procura?</AppText>
        <View style={styles.chips}>
          <Chip
            label="Tudo"
            selected={!draftCategory}
            onPress={() => {
              setDraftCategory(undefined);
            }}
          />
          {LISTING_CATEGORIES.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={draftCategory === item.id}
              onPress={() => {
                setDraftCategory(item.id);
                if (item.id !== 'horse') setDraftBreed(undefined);
              }}
            />
          ))}
        </View>
        {(!draftCategory || draftCategory === 'horse') && (
          <>
            <AppText variant="label">Raça</AppText>
            <View style={styles.chips}>
              <Chip label="Todas" selected={!draftBreed} onPress={() => setDraftBreed(undefined)} />
              {BREEDS.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={draftBreed === item.id}
                  onPress={() => setDraftBreed(item.id)}
                />
              ))}
            </View>
          </>
        )}
        <AppText variant="label">Estado</AppText>
        <StatePicker optional value={draftRegion} onChange={setDraftRegion} />
        <Button
          label="Ver anúncios"
          onPress={() => {
            setCategory(draftCategory);
            setBreed(draftBreed);
            setRegion(draftRegion);
            setSheet(undefined);
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }}
        />
        <Button
          label="Limpar filtros"
          variant="ghost"
          onPress={() => {
            setDraftCategory(undefined);
            setDraftBreed(undefined);
            setDraftRegion(undefined);
          }}
        />
      </OptionSheet>
      <OptionSheet
        visible={sheet === 'sort'}
        title="Ordenar anúncios"
        onClose={() => setSheet(undefined)}
      >
        {sortOptions.map((option) => (
          <Chip
            key={option.id}
            label={option.label}
            selected={
              sort === option.id ||
              (option.id === 'recent' &&
                sort === 'recommended' &&
                (mode !== 'browse' || !state.preferences.personalized))
            }
            onPress={() => {
              setSort(option.id);
              setSheet(undefined);
              listRef.current?.scrollToOffset({ offset: 0, animated: false });
            }}
          />
        ))}
      </OptionSheet>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { paddingHorizontal: 16, paddingBottom: 16 },
    header: { gap: 10, paddingBottom: 12 },
    brand: {
      justifyContent: 'space-between',
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 12,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    toolbar: { flexDirection: 'row', gap: 8 },
    footer: { paddingVertical: 24, gap: 16 },
    feedback: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      backgroundColor: theme.colors.subtle,
    },
  });
