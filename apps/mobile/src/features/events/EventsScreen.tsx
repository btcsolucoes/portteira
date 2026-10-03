import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { EVENTS, filterEvents, type Breed } from '@equestre/domain';
import { BreedFilters, BrowseHeader, DemoFooter } from '@/components/BrowseHeader';
import { AppText, Screen, StateView, useThemedStyles, type Theme } from '@/ui';
import { EventCard } from './EventCard';

export default function EventsScreen() {
  const { styles } = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [breed, setBreed] = useState<Breed>();
  const events = filterEvents(EVENTS, { query, breed });
  return (
    <Screen>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <EventCard event={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <BrowseHeader
            title="Encontre seu próximo encontro"
            description="Acompanhe o calendário do universo equestre."
            query={query}
            onQueryChange={setQuery}
            searchLabel="Buscar eventos"
            placeholder="Nome, cidade ou modalidade"
          >
            <BreedFilters value={breed} onChange={setBreed} />
            <AppText variant="label" accessibilityLiveRegion="polite">
              {events.length} eventos para explorar
            </AppText>
          </BrowseHeader>
        }
        ListEmptyComponent={
          <StateView
            kind="empty"
            title="Nenhum evento por aqui"
            description="Tente outra busca ou veja todas as raças."
            action={{
              label: 'Limpar filtros',
              onPress: () => {
                setQuery('');
                setBreed(undefined);
              },
            }}
          />
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
  });
