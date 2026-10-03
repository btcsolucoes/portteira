import { StyleSheet, View } from 'react-native';
import type { EventSummary } from '@equestre/domain';
import { ResultCard, Metadata, cardStyles } from '@/components/ResultCard';
import { AppText, Badge, useThemedStyles, type Theme } from '@/ui';
import { breedLabel, eventDate } from '@/lib/format';

export function EventCard({ event }: { event: EventSummary }) {
  const { theme, styles } = useThemedStyles(createStyles);
  const date = eventDate(event.startsAt).split(' ');
  return (
    <ResultCard
      href={{ pathname: '/events/[id]', params: { id: event.id } }}
      label={`Ver evento: ${event.title}, ${eventDate(event.startsAt)}, ${event.location.city}, ${event.location.state}, ${event.modality}`}
    >
      <View style={[cardStyles.content, cardStyles.row]}>
        <View style={styles.date}>
          <AppText variant="heading" color={theme.colors.primary}>
            {date[0]}
          </AppText>
          <AppText variant="caption" color={theme.colors.primary}>
            {date.slice(1).join(' ').replace('de ', '').toUpperCase()}
          </AppText>
        </View>
        <View style={cardStyles.grow}>
          <Badge label={event.modality} tone="accent" />
          <AppText variant="label">{event.title}</AppText>
          <Metadata icon="map-pin">{`${event.location.city}, ${event.location.state}`}</Metadata>
          <AppText variant="caption" color={theme.colors.muted}>
            {event.breeds.map(breedLabel).join(' · ')}
          </AppText>
        </View>
      </View>
    </ResultCard>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    date: {
      minWidth: 62,
      padding: theme.space.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.subtle,
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
  });
