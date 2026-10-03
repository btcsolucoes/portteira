import { useState } from 'react';
import { View } from 'react-native';
import { BRAZIL_STATES, normalizeSearchText } from '@equestre/domain';
import { AppText, Button, Chip, SearchField } from '@/ui';

export const STATE_NAMES: Record<(typeof BRAZIL_STATES)[number], string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};
export type BrazilState = (typeof BRAZIL_STATES)[number];

export function StatePicker({
  value,
  onChange,
  optional = false,
  disabled = false,
}: {
  value?: BrazilState;
  onChange: (value?: BrazilState) => void;
  optional?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const options = BRAZIL_STATES.filter((uf) =>
    normalizeSearchText(`${STATE_NAMES[uf]} ${uf}`).includes(normalizeSearchText(query)),
  );
  function select(uf?: BrazilState) {
    onChange(uf);
    setOpen(false);
    setQuery('');
  }
  return (
    <View style={{ gap: 8 }}>
      <Button
        variant="secondary"
        disabled={disabled}
        label={
          open
            ? 'Fechar lista de estados'
            : value
              ? `${STATE_NAMES[value]} · Alterar`
              : optional
                ? 'Todo o Brasil · Escolher estado'
                : 'Escolher estado'
        }
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <SearchField
            label="Buscar estado"
            placeholder="Digite o nome ou a sigla"
            value={query}
            onChangeText={setQuery}
          />
          {optional && <Chip label="Todo o Brasil" selected={!value} onPress={() => select()} />}
          {options.map((uf) => (
            <Chip
              key={uf}
              label={`${STATE_NAMES[uf]} (${uf})`}
              selected={value === uf}
              onPress={() => select(uf)}
            />
          ))}
          {!options.length && (
            <AppText>Nenhum estado encontrado. Confira o nome ou a sigla.</AppText>
          )}
        </>
      )}
    </View>
  );
}
