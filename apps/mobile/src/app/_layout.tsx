import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Stack, router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { IconButton, useTheme } from '@/ui';
import {
  useFonts,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';

export { ErrorBoundary } from 'expo-router';

function BackButton({ fallback }: { fallback: Href }) {
  return (
    <IconButton
      name="arrow-left"
      label="Voltar"
      visibleLabel="Voltar"
      labelPosition="right"
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
    />
  );
}

function Navigation() {
  const { theme, scheme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReducedMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.primary,
          headerShadowVisible: false,
          headerBackTitle: 'Voltar',
          headerTitleStyle: { fontFamily: 'Figtree_600SemiBold', fontSize: 17 },
          contentStyle: { backgroundColor: theme.colors.background },
          animation: reducedMotion ? 'none' : 'default',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="marketplace/create"
          options={{
            title: 'Criar anúncio',
            headerLeft: () => <BackButton fallback="/marketplace" />,
          }}
        />
        <Stack.Screen
          name="social/post/[id]"
          options={{
            title: 'Publicação',
            headerLeft: () => <BackButton fallback="/marketplace" />,
          }}
        />
        <Stack.Screen
          name="events/[id]"
          options={{ title: 'Evento', headerLeft: () => <BackButton fallback="/marketplace" /> }}
        />
        <Stack.Screen
          name="marketplace/listing/[id]"
          options={{ title: 'Anúncio', headerLeft: () => <BackButton fallback="/marketplace" /> }}
        />
        <Stack.Screen
          name="horses/[id]"
          options={{
            title: 'Ficha do cavalo',
            headerLeft: () => <BackButton fallback="/marketplace" />,
          }}
        />
        <Stack.Screen
          name="design-system"
          options={{
            title: 'Biblioteca visual',
            headerLeft: () => <BackButton fallback="/marketplace" />,
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'Página não encontrada' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  if (!loaded && !error) return null;
  return (
    <AppProviders>
      <Navigation />
    </AppProviders>
  );
}
