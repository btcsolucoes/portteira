import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import {
  createAssociationProvider,
  getEligibleHorseBadges,
  normalizeSearchText,
  sameAssociationAnimal,
  type HorseVerification,
  type MarketplaceListing,
} from '@equestre/domain';
import { DetailFact, DetailSection } from '@/components/DetailPage';
import { AppText, Badge, Button, useTheme } from '@/ui';

export function AssociationVerificationPanel({
  horse,
}: {
  horse: NonNullable<MarketplaceListing['horse']>;
}) {
  const { theme } = useTheme();
  const [result, setResult] = useState<{ key: string; value: HorseVerification }>();
  const [retry, setRetry] = useState(0);
  const [linkError, setLinkError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { association, registryNumber, name } = horse;
  const key = JSON.stringify([association, registryNumber, name, retry]);
  useEffect(() => {
    if (!registryNumber) return;
    const identity = { association, registryNumber };
    const provider = createAssociationProvider(association);
    const controller = new AbortController();
    let active = true;
    const publish = (value: HorseVerification) => {
      if (active && !controller.signal.aborted) setResult({ key, value });
    };
    const timeout = setTimeout(() => {
      publish({
        status: 'unavailable',
        identity,
        badges: [],
        reason: 'provider_unavailable',
        message: 'A associação não respondeu a tempo. O anúncio continua sem selo verificado.',
      });
      controller.abort();
    }, 8000);
    void (async () => {
      try {
        // A typed registry alone cannot transfer another animal's titles to this listing.
        const search = await provider.search(registryNumber, controller.signal);
        if (search.status === 'unavailable') {
          publish({
            status: 'unavailable',
            identity,
            badges: [],
            reason: search.reason,
            message: search.message,
          });
          return;
        }
        const matches = search.animals.filter(
          (animal) =>
            sameAssociationAnimal(animal.identity, identity) &&
            normalizeSearchText(animal.name) === normalizeSearchText(name),
        );
        if (matches.length !== 1) {
          publish({
            status: 'unverified',
            identity,
            badges: [],
            reason: matches.length > 1 ? 'ambiguous_identity' : 'not_found',
            message:
              'Não foi possível confirmar o nome e o registro deste animal. Nenhum selo foi atribuído.',
          });
          return;
        }
        publish(await provider.verify(identity, controller.signal));
      } catch {
        publish({
          status: 'unavailable',
          identity,
          badges: [],
          reason: 'provider_unavailable',
          message: 'Não foi possível conferir a fonte oficial. Tente novamente mais tarde.',
        });
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [association, registryNumber, name, key]);
  const verification = result?.key === key ? result.value : undefined;
  const badges = registryNumber
    ? getEligibleHorseBadges(verification, { association, registryNumber })
    : [];
  async function openSource(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError('Não foi possível abrir a fonte oficial. Tente novamente.');
    }
  }
  return (
    <DetailSection title="Dados do animal">
      <AppText>
        {name} · {association}
      </AppText>
      {badges.length > 0 ? (
        badges.map((badge, index) => (
          <DetailSection key={index} title={badge.title}>
            <Badge
              label={badge.type === 'champion' ? 'Título verificado' : 'Registro verificado'}
              tone="success"
            />
            {badge.type === 'champion' && (
              <AppText>
                {badge.event} · {badge.year}
                {'\n'}
                {badge.modality} · {badge.category}
              </AppText>
            )}
            <AppText variant="caption" color={theme.colors.muted}>
              Conferido em {new Date(badge.checkedAt).toLocaleDateString('pt-BR')} ·{' '}
              {badge.identity.association} · registro {badge.identity.registryNumber}
            </AppText>
            <Button
              variant="secondary"
              label="Consultar evidência oficial"
              onPress={() => {
                void openSource(badge.sourceUrl);
              }}
            />
          </DetailSection>
        ))
      ) : (
        <>
          <Badge
            label={
              !registryNumber
                ? 'Sem verificação oficial'
                : !verification
                  ? 'Conferindo associação…'
                  : 'Verificação pendente'
            }
          />
          <AppText color={theme.colors.muted} accessibilityLiveRegion="polite">
            Nenhum selo oficial foi confirmado para este anúncio.
          </AppText>
          <Button
            variant="ghost"
            label={detailsOpen ? 'Fechar detalhes da consulta' : 'Ver detalhes da consulta'}
            onPress={() => setDetailsOpen(!detailsOpen)}
          />
          {detailsOpen && (
            <>
              <DetailFact label="Registro informado" value={registryNumber ?? 'Não informado'} />
              <AppText color={theme.colors.muted} accessibilityLiveRegion="polite">
                {!registryNumber
                  ? 'O registro não foi informado. O nome, por si só, não confirma a identidade ou os títulos do animal.'
                  : verification && 'message' in verification
                    ? verification.message
                    : verification
                      ? 'Nenhuma conquista oficial foi confirmada para este anúncio.'
                      : 'Conferindo a identidade do animal antes de consultar seus títulos.'}
              </AppText>
              {!!registryNumber && verification && (
                <Button
                  variant="ghost"
                  label="Tentar verificar novamente"
                  onPress={() => setRetry((value) => value + 1)}
                />
              )}
            </>
          )}
        </>
      )}
      {badges.length > 0 && (
        <AppText variant="caption" color={theme.colors.muted}>
          Os selos confirmam apenas os dados descritos na fonte. Não comprovam a propriedade do
          vendedor ou a saúde do animal.
        </AppText>
      )}
      {!!linkError && <AppText accessibilityLiveRegion="polite">{linkError}</AppText>}
    </DetailSection>
  );
}
