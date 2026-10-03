import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { useTheme } from '@/ui';
export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs
      initialRouteName="marketplace"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 72 + insets.bottom + Math.max(0, fontScale - 1) * 32,
          paddingTop: 4,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontFamily: 'Figtree_600SemiBold', fontSize: 12 },
        tabBarItemStyle: { minHeight: 48 },
        tabBarHideOnKeyboard: true,
        animation: 'none',
      }}
    >
      {(
        [
          { name: 'marketplace', title: 'Mercado', icon: 'shopping-bag' },
          { name: 'favorites', title: 'Favoritos', icon: 'heart' },
          { name: 'my-listings', title: 'Meus anúncios', icon: 'tag' },
          { name: 'preferences', title: 'Preferências', icon: 'sliders' },
        ] as const
      ).map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarAccessibilityLabel: item.title,
            tabBarIcon: ({ color, size }) => (
              <Feather accessible={false} name={item.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="social" options={{ href: null }} />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="horses" options={{ href: null }} />
    </Tabs>
  );
}
