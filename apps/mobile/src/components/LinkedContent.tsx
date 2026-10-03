import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EVENTS, LISTINGS, type SocialPost } from '@equestre/domain';
import { AppText, useThemedStyles, type Theme } from '@/ui';
import { eventDate, money } from '@/lib/format';
export function LinkedContent({
  attachment,
}: {
  attachment: NonNullable<SocialPost['attachment']>;
}) {
  const { theme, styles } = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false),
    [pressed, setPressed] = useState(false);
  const event =
    attachment.type === 'event' ? EVENTS.find((item) => item.id === attachment.id) : undefined;
  const listing =
    attachment.type === 'listing' ? LISTINGS.find((item) => item.id === attachment.id) : undefined;
  const item = event ?? listing;
  if (!item) return null;
  const href = event
    ? { pathname: '/events/[id]' as const, params: { id: item.id } }
    : { pathname: '/marketplace/listing/[id]' as const, params: { id: item.id } };
  const action = event ? 'Ver evento' : 'Ver anúncio';
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={action + ': ' + item.title}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={StyleSheet.flatten([
          styles.row,
          pressed && { backgroundColor: theme.colors.subtle },
          focused && { borderColor: theme.colors.primary },
        ])}
      >
        <View style={styles.icon}>
          <Feather
            accessible={false}
            name={event ? 'calendar' : 'tag'}
            size={20}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.copy}>
          <AppText variant="label" color={theme.colors.primary}>
            {action}{' '}
            {event
              ? '· ' + eventDate(event.startsAt)
              : listing
                ? '· ' + money(listing.priceInCents)
                : ''}
          </AppText>
          <AppText variant="caption" numberOfLines={2}>
            {item.title}
          </AppText>
        </View>
        <Feather accessible={false} name="chevron-right" size={20} color={theme.colors.primary} />
      </Pressable>
    </Link>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    icon: {
      height: 36,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.subtle,
      borderRadius: 8,
    },
    copy: { flex: 1, gap: 2 },
  });
