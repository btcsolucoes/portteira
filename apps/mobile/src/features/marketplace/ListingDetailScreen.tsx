import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DetailFact, DetailPage, DetailSection, MissingDetail } from '@/components/DetailPage';
import { MediaPhoto } from '@/components/MediaPhoto';
import { AppText, Badge, Button, useTheme } from '@/ui';
import { breedLabel, money } from '@/lib/format';
import { useMarketplace } from '@/providers/MarketplaceProvider';
import { AssociationVerificationPanel } from './AssociationVerificationPanel';

export default function ListingDetailScreen() {
  const [manageOpen, setManageOpen] = useState(false);
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, state, ready, storageError, toggleFavorite, recordView, setListingStatus } =
    useMarketplace();
  const listing = listings.find((item) => item.id === id);
  const exists = Boolean(listing);
  useEffect(() => {
    if (ready && exists) recordView(id);
  }, [ready, exists, id, recordView]);
  if (!ready)
    return (
      <DetailPage title="Carregando anúncio" showDemoBadge={false}>
        <AppText>Buscando os dados deste aparelho…</AppText>
      </DetailPage>
    );
  if (!listing)
    return (
      <MissingDetail
        type="Anúncio"
        fallbackHref="/marketplace"
        fallbackLabel="Voltar ao marketplace"
      />
    );
  const local = listing.provenance.kind === 'local';
  return (
    <DetailPage
      title={listing.title}
      description={listing.location.city + ', ' + listing.location.state}
      showDemoBadge={!local}
    >
      {local && <Badge label="Anúncio local · neste aparelho" />}
      {listing.status !== 'active' && (
        <Badge label={listing.status === 'sold' ? 'Vendido' : 'Pausado'} />
      )}
      {!local && listing.id === 'listing-marchadora' && <MediaPhoto imageKey={listing.imageKey} />}
      <AppText variant="heading" color={theme.colors.primary}>
        {money(listing.priceInCents)}
      </AppText>
      <DetailSection title="Sobre este anúncio">
        <AppText>{listing.description}</AppText>
      </DetailSection>
      {listing.breed && <DetailFact label="Raça" value={breedLabel(listing.breed)} />}
      <DetailFact label="Anunciante" value={listing.seller} />
      {listing.horse ? (
        <AssociationVerificationPanel horse={listing.horse} />
      ) : listing.category === 'horse' ? (
        <AppText variant="caption" color={theme.colors.muted}>
          Animal fictício do catálogo. Nenhum registro ou título oficial foi verificado.
        </AppText>
      ) : null}
      {!!storageError && <AppText accessibilityLiveRegion="polite">{storageError}</AppText>}
      <Button
        label={state.favoriteIds.includes(id) ? 'Remover dos favoritos' : 'Favoritar anúncio'}
        variant="secondary"
        onPress={() => toggleFavorite(id)}
      />
      {local && (
        <>
          <Button
            variant="secondary"
            label={manageOpen ? 'Fechar opções do meu anúncio' : 'Gerenciar meu anúncio'}
            onPress={() => setManageOpen(!manageOpen)}
          />
          {manageOpen && (
            <DetailSection title="Gerenciar meu anúncio">
              <AppText variant="caption" color={theme.colors.muted}>
                Anúncios pausados ou vendidos saem do Mercado. Eles continuam em Meus anúncios.
              </AppText>
              <Button
                variant="secondary"
                label={listing.status === 'active' ? 'Pausar anúncio' : 'Reativar anúncio'}
                onPress={() =>
                  setListingStatus(id, listing.status === 'active' ? 'paused' : 'active')
                }
              />
              {listing.status !== 'sold' && (
                <Button
                  variant="ghost"
                  label="Marcar como vendido"
                  onPress={() => setListingStatus(id, 'sold')}
                />
              )}
            </DetailSection>
          )}
        </>
      )}
      <DetailSection title={local ? 'Salvo neste aparelho' : 'Anúncio demonstrativo'}>
        <AppText color={theme.colors.muted}>
          {local
            ? 'Seu anúncio está salvo só neste aparelho. Ele ainda não aparece para outras pessoas.'
            : 'Este é um exemplo fictício, com imagem ilustrativa e sem contato disponível.'}
        </AppText>
      </DetailSection>
    </DetailPage>
  );
}
