import { useState } from 'react';
import { View } from 'react-native';
import { DetailPage, DetailSection } from '@/components/DetailPage';
import { AppText, Badge, Button, Chip, SearchField, StateView, useTheme } from '@/ui';

// Internal review surface, deliberately absent from product navigation.
export default function DesignSystem() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(false);
  return (
    <DetailPage
      title="Um mesmo universo visual"
      description="Primitivas e estados para revisão da fundação."
    >
      <DetailSection title="Tipografia">
        <AppText variant="title">Origens que conectam.</AppText>
        <AppText variant="heading">Feito para o mundo equestre</AppText>
        <AppText>
          Texto de leitura, confortável em telas pequenas e com tamanho de fonte ampliado.
        </AppText>
        <AppText variant="caption" color={theme.colors.muted}>
          Informação complementar
        </AppText>
      </DetailSection>
      <DetailSection title="Ações">
        <Button label="Ação principal" onPress={() => setSelected((s) => !s)} />
        <Button
          label="Ação secundária"
          variant="secondary"
          onPress={() => setSelected((s) => !s)}
        />
        <Button label="Indisponível" disabled onPress={() => undefined} />
        <Button label="Carregando" loading onPress={() => undefined} />
        <Chip
          label={selected ? 'Selecionado' : 'Selecionar'}
          selected={selected}
          onPress={() => setSelected((s) => !s)}
        />
      </DetailSection>
      <SearchField
        label="Busca com rótulo"
        value={query}
        onChangeText={setQuery}
        placeholder="Nome ou registro"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
        <Badge label="Informação" />
        <Badge label="Destaque" tone="accent" />
        <Badge label="Selecionado" tone="success" />
      </View>
      <StateView kind="loading" title="Buscando resultados" />
      <StateView kind="empty" title="Nenhum resultado" description="Tente outra busca." />
      <StateView
        kind="error"
        title="A consulta falhou"
        description="Seu conteúdo continua disponível."
        action={{ label: 'Tentar novamente', onPress: () => setQuery('') }}
      />
    </DetailPage>
  );
}
