import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SOCIAL_POSTS } from '@equestre/domain';
import { BrandHeader, DemoFooter } from '@/components/BrowseHeader';
import { AppText, Screen, useThemedStyles, type Theme } from '@/ui';
import { SocialPostCard } from './SocialPostCard';
const filters = [
  { id: 'all', label: 'Para você' },
  { id: 'event', label: 'Eventos' },
  { id: 'listing', label: 'Anúncios' },
] as const;
export default function SocialScreen() {
  const { theme, styles } = useThemedStyles(createStyles);
  const [filter, setFilter] = useState<'all' | 'event' | 'listing'>('all');
  const posts = SOCIAL_POSTS.filter((post) => filter === 'all' || post.attachment?.type === filter);
  return (
    <Screen>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SocialPostCard post={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <BrandHeader subtitle="Prévia com conteúdo fictício" />
            <View style={styles.filters}>
              {filters.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: filter === item.id }}
                  onPress={() => setFilter(item.id)}
                  style={({ pressed }) => [
                    styles.filter,
                    filter === item.id && styles.active,
                    pressed && { backgroundColor: theme.colors.subtle },
                  ]}
                >
                  <AppText
                    variant="label"
                    color={filter === item.id ? theme.colors.primary : theme.colors.muted}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={<DemoFooter />}
      />
    </Screen>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { paddingBottom: 16 },
    header: { paddingHorizontal: 16, backgroundColor: theme.colors.background },
    filters: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    filter: {
      flex: 1,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    active: { borderBottomColor: theme.colors.primary },
    separator: { height: 8, backgroundColor: theme.colors.background },
  });
