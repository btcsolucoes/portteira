import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  HorseProviderError,
  type Horse,
  type HorsePedigree,
  type PedigreeNode,
} from '@equestre/domain';
import { DetailPage, MissingDetail } from '@/components/DetailPage';
import { AppText, StateView, useThemedStyles, type Theme } from '@/ui';
import { birthDate, breedLabel } from '@/lib/format';
import { horseProvider } from './provider';

type Data = { horse: Horse; pedigree: HorsePedigree; offspring: Horse[] };
type DetailState = { status: 'loading' | 'error' | 'missing' } | { status: 'ready'; data: Data };
const sexLabels = { male: 'Macho', female: 'Fêmea', gelding: 'Castrado' };

function Ancestor({ label, node }: { label: string; node?: PedigreeNode }) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.ancestor} accessible>
      <AppText variant="caption" color={theme.colors.muted} style={styles.ancestorLabel}>
        {label}
      </AppText>
      <View style={styles.grow}>
        <AppText variant="label">{node?.horse?.name ?? 'Não informado'}</AppText>
        {node?.horse && (
          <AppText variant="caption" color={theme.colors.muted}>
            {node.horse.registryNumber}
          </AppText>
        )}
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.fact} accessible>
      <AppText variant="caption" color={theme.colors.muted}>
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

function Disclosure({
  title,
  summary,
  count,
  icon,
  children,
  accent = false,
}: {
  title: string;
  summary: string;
  count?: number;
  icon: React.ComponentProps<typeof Feather>['name'];
  children: ReactNode;
  accent?: boolean;
}) {
  const { theme, styles } = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.disclosure}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}${count === undefined ? '' : `, ${count}`}. ${summary}`}
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? 'Recolhe os detalhes.' : 'Mostra os detalhes nesta ficha.'}
        onPress={() => setExpanded((value) => !value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.disclosureTrigger,
          pressed && styles.pressed,
          focused && styles.focused,
        ]}
      >
        <Feather
          name={icon}
          size={22}
          color={accent ? theme.colors.accentText : theme.colors.primary}
          accessible={false}
        />
        <View style={styles.grow}>
          <View style={styles.disclosureTitle}>
            <AppText variant="body" style={styles.emphasis}>
              {title}
            </AppText>
            {count !== undefined && (
              <AppText variant="numeric" color={theme.colors.muted}>
                {count}
              </AppText>
            )}
          </View>
          <AppText variant="caption" color={theme.colors.muted}>
            {summary}
          </AppText>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.muted}
          accessible={false}
        />
      </Pressable>
      {expanded && <View style={styles.disclosureContent}>{children}</View>}
    </View>
  );
}

function OffspringRow({ horse }: { horse: Horse }) {
  const { theme, styles } = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  return (
    <Link href={{ pathname: '/horses/[id]', params: { id: horse.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Consultar ficha de ${horse.name}, registro ${horse.registryNumber}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.offspring,
          pressed && styles.pressed,
          focused && styles.focused,
        ]}
      >
        <View style={styles.grow}>
          <AppText variant="label">{horse.name}</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {horse.registryNumber} · {sexLabels[horse.sex]} · {horse.coat}
          </AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {horse.sire?.name ?? 'Pai não informado'} × {horse.dam?.name ?? 'Mãe não informada'}
          </AppText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.colors.primary} accessible={false} />
      </Pressable>
    </Link>
  );
}

export default function HorseDetailScreen() {
  const { theme, styles } = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [result, setResult] = useState<{ key: string; state: DetailState }>();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([id, attempt]);
  const state: DetailState = result?.key === key ? result.state : { status: 'loading' };
  useEffect(() => {
    const controller = new AbortController();
    const context = { signal: controller.signal };
    Promise.all([
      horseProvider.getById(id, context),
      horseProvider.getPedigree(id, context),
      horseProvider.getOffspring(id, { limit: 50 }, context),
    ])
      .then(([horse, pedigree, offspring]) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            state: { status: 'ready', data: { horse, pedigree, offspring: offspring.items } },
          });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            state: {
              status:
                error instanceof HorseProviderError && error.code === 'NOT_FOUND'
                  ? 'missing'
                  : 'error',
            },
          });
      });
    return () => controller.abort();
  }, [id, key]);
  if (state.status === 'missing')
    return (
      <MissingDetail
        type="Cavalo"
        fallbackHref="/horses"
        fallbackLabel="Voltar à pesquisa de cavalos"
      />
    );
  if (state.status !== 'ready')
    return (
      <DetailPage title="Ficha do cavalo">
        <StateView
          kind={state.status}
          title={
            state.status === 'loading'
              ? 'Consultando a ficha'
              : 'Não foi possível consultar a ficha'
          }
          action={
            state.status === 'error'
              ? { label: 'Tentar novamente', onPress: () => setAttempt((a) => a + 1) }
              : undefined
          }
        />
      </DetailPage>
    );
  const { horse, pedigree, offspring } = state.data;
  const root = pedigree.root;
  return (
    <DetailPage title={horse.name} description={breedLabel(horse.breed)} showDemoBadge={false}>
      <View style={styles.identity}>
        <View style={styles.registry} accessible>
          <AppText variant="caption" color={theme.colors.muted}>
            Registro
          </AppText>
          <AppText variant="numeric" color={theme.colors.primary}>
            {horse.registryNumber}
          </AppText>
        </View>
        <View style={styles.facts}>
          <Fact label="Sexo" value={sexLabels[horse.sex]} />
          <Fact label="Nascimento" value={birthDate(horse.birthDate)} />
          <Fact label="Pelagem" value={horse.coat} />
        </View>
      </View>
      <View style={styles.parents}>
        <Ancestor label="Pai" node={root.sire} />
        <View style={styles.separator} />
        <Ancestor label="Mãe" node={root.dam} />
      </View>
      <View style={styles.disclosures}>
        <Disclosure
          key={`${horse.id}:pedigree`}
          title="Pedigree"
          summary="Avós, bisavós e linhagem"
          icon="git-branch"
        >
          <View style={styles.origin}>
            <Fact label="Criador" value={horse.breeder} />
            <Fact label="Linhagem" value={horse.lineage} />
          </View>
          {[
            { label: 'Ramo paterno', node: root.sire },
            { label: 'Ramo materno', node: root.dam },
          ].map(({ label, node }) => (
            <View key={label} style={styles.branch}>
              <AppText variant="label" color={theme.colors.primary} accessibilityRole="header">
                {label}
              </AppText>
              <Ancestor label="Avô" node={node?.sire} />
              <Ancestor label="Avó" node={node?.dam} />
              <View style={styles.generation}>
                <AppText variant="caption" color={theme.colors.muted}>
                  Pais do avô
                </AppText>
                <Ancestor label="Bisavô" node={node?.sire?.sire} />
                <Ancestor label="Bisavó" node={node?.sire?.dam} />
              </View>
              <View style={styles.generation}>
                <AppText variant="caption" color={theme.colors.muted}>
                  Pais da avó
                </AppText>
                <Ancestor label="Bisavô" node={node?.dam?.sire} />
                <Ancestor label="Bisavó" node={node?.dam?.dam} />
              </View>
            </View>
          ))}
        </Disclosure>
        <Disclosure
          key={`${horse.id}:offspring`}
          title="Filhos"
          count={offspring.length}
          summary="Descendentes nesta base"
          icon="users"
        >
          {offspring.length ? (
            offspring.map((child) => <OffspringRow key={child.id} horse={child} />)
          ) : (
            <AppText color={theme.colors.muted}>
              Nenhum filho informado nesta base de demonstração.
            </AppText>
          )}
        </Disclosure>
        <Disclosure
          key={`${horse.id}:awards`}
          title="Prêmios"
          count={horse.awards.length}
          summary="Premiações informadas"
          icon="award"
          accent
        >
          {horse.awards.length ? (
            horse.awards.map((award) => (
              <View style={styles.record} key={`${award.year}:${award.title}`} accessible>
                <AppText variant="numeric" color={theme.colors.accentText}>
                  {award.year}
                </AppText>
                <AppText style={styles.grow}>{award.title}</AppText>
              </View>
            ))
          ) : (
            <AppText color={theme.colors.muted}>Nenhuma premiação informada nesta base.</AppText>
          )}
        </Disclosure>
        <Disclosure
          key={`${horse.id}:results`}
          title="Resultados"
          count={horse.results.length}
          summary="Histórico esportivo"
          icon="flag"
        >
          {horse.results.length ? (
            horse.results.map((result) => (
              <View style={styles.result} key={`${result.date}:${result.event}`} accessible>
                <View style={styles.resultMeta}>
                  <AppText variant="label" color={theme.colors.primary}>
                    {result.placement}º lugar
                  </AppText>
                  <AppText variant="caption" color={theme.colors.muted}>
                    {birthDate(result.date)}
                  </AppText>
                </View>
                <AppText>{result.event}</AppText>
              </View>
            ))
          ) : (
            <AppText color={theme.colors.muted}>Nenhum resultado informado nesta base.</AppText>
          )}
        </Disclosure>
      </View>
      <View style={styles.provenance}>
        <Feather name="info" size={16} color={theme.colors.muted} accessible={false} />
        <View style={styles.grow}>
          <AppText variant="caption" color={theme.colors.muted}>
            Ficha de demonstração · Fonte: Equestre Demo
          </AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            Dados fictícios, sem vínculo com registros oficiais das associações.
          </AppText>
        </View>
      </View>
    </DetailPage>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    grow: { flex: 1, minWidth: 0 },
    emphasis: { fontFamily: theme.typography.label.fontFamily },
    identity: { gap: theme.space.compact },
    registry: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      gap: theme.space.sm,
    },
    facts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: theme.space.md,
      rowGap: theme.space.sm,
    },
    fact: { flexGrow: 1, flexBasis: 88, gap: theme.space.xs },
    parents: {
      paddingHorizontal: theme.space.compact,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.sm,
    },
    ancestor: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: theme.space.compact,
      paddingVertical: theme.space.sm,
    },
    ancestorLabel: { width: 52, flexShrink: 0 },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
    disclosures: { borderTopWidth: 1, borderTopColor: theme.colors.border },
    disclosure: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    disclosureTrigger: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space.compact,
      paddingHorizontal: theme.space.xs,
      paddingVertical: theme.space.compact,
      borderWidth: 2,
      borderColor: theme.colors.transparent,
      borderRadius: theme.radius.sm,
    },
    disclosureTitle: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space.sm },
    disclosureContent: {
      gap: theme.space.compact,
      paddingHorizontal: theme.space.sm,
      paddingBottom: theme.space.md,
    },
    pressed: { backgroundColor: theme.colors.subtle },
    focused: { borderColor: theme.colors.primary },
    origin: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space.md,
      paddingBottom: theme.space.sm,
    },
    branch: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.space.compact,
      gap: theme.space.xs,
    },
    generation: {
      paddingLeft: theme.space.compact,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      marginTop: theme.space.sm,
    },
    offspring: {
      minHeight: theme.sizes.touch,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space.sm,
      padding: theme.space.sm,
      borderWidth: 2,
      borderColor: theme.colors.transparent,
      borderRadius: theme.radius.sm,
    },
    record: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: theme.space.compact,
      paddingVertical: theme.space.sm,
    },
    result: { gap: theme.space.xs, paddingVertical: theme.space.sm },
    resultMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: theme.space.sm,
    },
    provenance: { flexDirection: 'row', gap: theme.space.sm, alignItems: 'flex-start' },
  });
