import { Link } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { LISTING_CATEGORIES, type MarketplaceListing } from '@equestre/domain';
import { AppText, Badge, Button, IconButton, useThemedStyles, type Theme } from '@/ui';
import { MediaPhoto } from '@/components/MediaPhoto';
import { OptionSheet } from '@/components/OptionSheet';
import { useMarketplace } from '@/providers/MarketplaceProvider';
import { breedLabel, money } from '@/lib/format';
// Concise summaries transcribe facts already stated in the fictional descriptions.
const knownDetails: Record<string, string> = {
  'listing-marchadora': 'Fêmea · 5 anos · Marcha',
  'listing-quarto': 'Castrado · 6 anos · Trabalho',
  'listing-arabe': 'Fêmea · 3 anos',
  'listing-sela': 'Assento de 16 polegadas',
};
export function MarketplaceCard({
  listing,
  reason,
  allowDismiss = false,
  onDismiss,
}: {
  listing: MarketplaceListing;
  reason?: string;
  allowDismiss?: boolean;
  onDismiss?: (id: string) => void;
}) {
  const { theme, styles } = useThemedStyles(createStyles);
  const { state, toggleFavorite } = useMarketplace();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [focused, setFocused] = useState(false),
    [pressed, setPressed] = useState(false);
  const isSaved = state.favoriteIds.includes(listing.id);
  const label = LISTING_CATEGORIES.find((item) => item.id === listing.category)?.label ?? 'Anúncio';
  const hasPhoto = listing.provenance.kind === 'fictional' && listing.id === 'listing-marchadora';
  return (
    <View style={styles.card}>
      <Link href={{ pathname: '/marketplace/listing/[id]', params: { id: listing.id } }} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={
            listing.title + ', ' + money(listing.priceInCents) + ', ' + listing.location.city
          }
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={StyleSheet.flatten([
            styles.link,
            pressed && { backgroundColor: theme.colors.subtle },
            focused && { borderColor: theme.colors.primary },
          ])}
        >
          <View style={styles.media}>
            {hasPhoto ? (
              <MediaPhoto compact imageKey={listing.imageKey} style={styles.photo} />
            ) : (
              <View style={styles.noPhoto}>
                <Feather
                  accessible={false}
                  name={
                    listing.category === 'service'
                      ? 'camera'
                      : listing.category === 'equipment'
                        ? 'briefcase'
                        : listing.category === 'product'
                          ? 'package'
                          : 'image'
                  }
                  size={28}
                  color={theme.colors.muted}
                />
                <AppText variant="caption" color={theme.colors.muted}>
                  Sem foto
                </AppText>
              </View>
            )}
            {hasPhoto && (
              <AppText variant="metadata" color={theme.colors.muted} style={styles.photoLabel}>
                Ilustrativa
              </AppText>
            )}
          </View>
          <View style={styles.info}>
            <AppText variant="metadata" color={theme.colors.primary}>
              {listing.breed ? breedLabel(listing.breed) : label}
            </AppText>
            <AppText variant={listing.priceInCents === null ? 'heading' : 'price'}>
              {money(listing.priceInCents)}
            </AppText>
            <AppText variant="label">{listing.title}</AppText>
            {listing.status !== 'active' && (
              <Badge label={listing.status === 'sold' ? 'Vendido' : 'Pausado'} />
            )}
            {knownDetails[listing.id] && (
              <AppText variant="caption" color={theme.colors.muted}>
                {knownDetails[listing.id]}
              </AppText>
            )}
            <AppText variant="caption" color={theme.colors.muted}>
              {listing.location.city}, {listing.location.state}
            </AppText>
          </View>
        </Pressable>
      </Link>
      <View style={styles.bottom}>
        <Button variant="ghost" label="Opções" onPress={() => setOptionsOpen(true)} />
        <IconButton
          labelPosition="right"
          name="heart"
          label={(isSaved ? 'Remover dos favoritos: ' : 'Favoritar: ') + listing.title}
          visibleLabel={isSaved ? 'Favoritado' : 'Favoritar'}
          selected={isSaved}
          onPress={() => toggleFavorite(listing.id)}
          style={styles.favorite}
        />
      </View>
      <AppText
        variant="metadata"
        color={theme.colors.muted}
        style={{ paddingHorizontal: 12, paddingBottom: 8 }}
      >
        {listing.provenance.kind === 'local' ? 'Salvo neste aparelho' : 'Exemplo fictício'}
      </AppText>
      <OptionSheet
        visible={optionsOpen}
        title="Opções do anúncio"
        onClose={() => setOptionsOpen(false)}
      >
        <AppText variant="heading">{listing.title}</AppText>
        {reason && <AppText color={theme.colors.muted}>{reason}</AppText>}
        {allowDismiss && onDismiss && (
          <Button
            variant="secondary"
            label="Ocultar este anúncio"
            onPress={() => {
              setOptionsOpen(false);
              onDismiss(listing.id);
            }}
          />
        )}
        <Button
          variant="secondary"
          label={isSaved ? 'Remover dos favoritos' : 'Favoritar'}
          onPress={() => {
            toggleFavorite(listing.id);
            setOptionsOpen(false);
          }}
        />
      </OptionSheet>
    </View>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    link: {
      padding: 12,
      paddingBottom: 0,
      flexDirection: 'row',
      gap: 12,
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: 12,
    },
    media: { width: 112 },
    photo: { width: '100%', height: 132, borderRadius: 8 },
    noPhoto: {
      minHeight: 132,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.subtle,
      borderRadius: 8,
    },
    photoLabel: { textAlign: 'center', paddingTop: 4 },
    info: { flex: 1, gap: 3 },
    bottom: {
      minHeight: 48,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 4,
    },
    favorite: { flexDirection: 'row', minWidth: 82, paddingVertical: 4 },
  });
