import { router } from 'expo-router';
import { DetailPage } from '@/components/DetailPage';
import { StateView } from '@/ui';
export default function NotFound() {
  return (
    <DetailPage title="Página não encontrada">
      <StateView
        kind="empty"
        title="Vamos retomar o caminho?"
        description="Este endereço não existe na plataforma."
        action={{ label: 'Ir para o marketplace', onPress: () => router.replace('/marketplace') }}
      />
    </DetailPage>
  );
}
