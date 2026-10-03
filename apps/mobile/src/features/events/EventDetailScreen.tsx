import { useLocalSearchParams } from 'expo-router';
import { EVENTS } from '@equestre/domain';
import { DetailFact, DetailPage, DetailSection, MissingDetail } from '@/components/DetailPage';
import { AppText, useTheme } from '@/ui';
import { breedLabel, fullDate } from '@/lib/format';

export default function EventDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = EVENTS.find((item) => item.id === id);
  if (!event)
    return (
      <MissingDetail type="Evento" fallbackHref="/events" fallbackLabel="Voltar aos eventos" />
    );
  return (
    <DetailPage title={event.title} description={event.modality}>
      <DetailFact
        label="Quando"
        value={`${fullDate(event.startsAt)} a ${fullDate(event.endsAt)}`}
      />
      <DetailFact
        label="Onde"
        value={`${event.venue} · ${event.location.city}, ${event.location.state}`}
      />
      <DetailFact label="Organização" value={event.organizer} />
      <DetailFact label="Raças" value={event.breeds.map(breedLabel).join(' · ')} />
      <DetailSection title="Sobre o encontro">
        <AppText>{event.description}</AppText>
      </DetailSection>
      <AppText variant="caption" color={theme.colors.muted}>
        Evento de demonstração, sem inscrição ou ingresso disponível. Futuras inscrições serão
        realizadas com o organizador ou uma plataforma externa.
      </AppText>
    </DetailPage>
  );
}
