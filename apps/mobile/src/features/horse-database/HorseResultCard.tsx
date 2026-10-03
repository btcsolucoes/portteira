import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Horse } from '@equestre/domain';
import { ResultCard, cardStyles } from '@/components/ResultCard';
import { AppText, useTheme } from '@/ui';
import { breedLabel } from '@/lib/format';

export function HorseResultCard({ horse }: { horse: Horse }) {
  const { theme } = useTheme();
  return (
    <ResultCard
      href={{ pathname: '/horses/[id]', params: { id: horse.id } }}
      label={`Consultar ficha de ${horse.name}, ${breedLabel(horse.breed)}, registro ${horse.registryNumber}, ${horse.coat}`}
    >
      <View style={[cardStyles.content, cardStyles.row]}>
        <View style={cardStyles.grow}>
          <AppText variant="caption" color={theme.colors.primary}>
            {breedLabel(horse.breed)}
          </AppText>
          <AppText variant="heading">{horse.name}</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {horse.registryNumber} · {horse.coat}
          </AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {horse.sire?.name ?? 'Pai não informado'} × {horse.dam?.name ?? 'Mãe não informada'}
          </AppText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.colors.muted} />
      </View>
    </ResultCard>
  );
}
