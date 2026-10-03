import { useState } from 'react';
import { router } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';
import type { SocialPost } from '@equestre/domain';
import { AppText, IconButton, useThemedStyles, type Theme } from '@/ui';
import { MediaPhoto } from '@/components/MediaPhoto';
import { LinkedContent } from '@/components/LinkedContent';
import { useDemoState } from '@/providers/AppProviders';
export function SocialPostCard({ post, detail = false }: { post: SocialPost; detail?: boolean }) {
  const { theme, styles } = useThemedStyles(createStyles);
  const { liked, saved, toggleLike, toggleSave } = useDemoState();
  const [shareError, setShareError] = useState(false);
  const isLiked = liked.has(post.id),
    isSaved = saved.has(post.id);
  const open = () => router.push({ pathname: '/social/post/[id]', params: { id: post.id } });
  async function share() {
    setShareError(false);
    try {
      await Share.share({
        message: post.author.name + ' · Equestre (demonstração)\n\n' + post.body,
      });
    } catch {
      setShareError(true);
    }
  }
  return (
    <View style={styles.post}>
      <View style={styles.author}>
        <View style={styles.avatar}>
          <AppText variant="label" color={theme.colors.primary}>
            {post.author.initials}
          </AppText>
        </View>
        <View style={styles.authorText}>
          <AppText variant="label">{post.author.name}</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {post.author.subtitle.replace(' · perfil fictício', '')} ·{' '}
            {new Intl.DateTimeFormat('pt-BR', {
              day: 'numeric',
              month: 'short',
              timeZone: 'America/Sao_Paulo',
            }).format(new Date(post.publishedAt))}
          </AppText>
        </View>
      </View>
      {post.imageKey && (
        <MediaPhoto
          imageKey={post.imageKey}
          label="Cena equestre ilustrativa gerada para esta publicação fictícia"
          aspectRatio={4 / 3}
        />
      )}
      <View style={styles.actions}>
        <IconButton
          name="heart"
          label={isLiked ? 'Descurtir publicação' : 'Curtir publicação'}
          visibleLabel={isLiked ? 'Curtiu' : 'Curtir'}
          selected={isLiked}
          onPress={() => toggleLike(post.id)}
          style={styles.action}
        />
        <IconButton
          name="message-circle"
          label="Ver publicação e informações sobre comentários"
          visibleLabel="Comentários"
          onPress={open}
          disabled={detail}
          style={styles.action}
        />
        <IconButton
          name="share-2"
          label="Compartilhar texto da publicação"
          visibleLabel="Compartilhar"
          onPress={() => void share()}
          style={styles.action}
        />
        <IconButton
          name="bookmark"
          label={isSaved ? 'Remover publicação dos salvos' : 'Salvar publicação'}
          visibleLabel={isSaved ? 'Salvo' : 'Salvar'}
          selected={isSaved}
          onPress={() => toggleSave(post.id)}
          style={styles.action}
        />
      </View>
      <View style={styles.copy}>
        <AppText variant="label">
          {post.likes + (isLiked ? 1 : 0)} curtidas{' '}
          <AppText variant="caption" color={theme.colors.muted}>
            · {post.comments} comentários no exemplo
          </AppText>
        </AppText>
        <AppText>{post.body}</AppText>
        {shareError && (
          <AppText variant="caption" accessibilityLiveRegion="polite" color={theme.colors.danger}>
            O compartilhamento não está disponível neste navegador. Use o aplicativo em um
            dispositivo compatível.
          </AppText>
        )}
        {post.attachment && <LinkedContent attachment={post.attachment} />}
      </View>
    </View>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    post: { backgroundColor: theme.colors.surface },
    author: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorText: { flex: 1, gap: 2 },
    actions: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 4 },
    action: { flex: 1, paddingHorizontal: 2 },
    copy: { gap: 8, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  });
