import { useLocalSearchParams } from 'expo-router';
import { SOCIAL_POSTS } from '@equestre/domain';
import { DetailPage, MissingDetail } from '@/components/DetailPage';
import { AppText, useTheme } from '@/ui';
import { SocialPostCard } from './SocialPostCard';

export default function PostDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = SOCIAL_POSTS.find((item) => item.id === id);
  if (!post)
    return (
      <MissingDetail type="Publicação" fallbackHref="/social" fallbackLabel="Voltar à comunidade" />
    );
  return (
    <DetailPage title="Na comunidade">
      <SocialPostCard post={post} detail />
      <AppText variant="caption" color={theme.colors.muted}>
        Comentários e publicação de conteúdo estarão disponíveis em uma próxima etapa.
      </AppText>
    </DetailPage>
  );
}
