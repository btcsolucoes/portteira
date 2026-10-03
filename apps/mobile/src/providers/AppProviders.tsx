import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { env } from '@/config/env';
import { ThemeProvider } from '@/ui/ThemeProvider';
import { MarketplaceProvider } from './MarketplaceProvider';

type DemoState = {
  liked: ReadonlySet<string>;
  saved: ReadonlySet<string>;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
};
const DemoContext = createContext<DemoState | null>(null);
function toggle(current: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
export function AppProviders({ children }: PropsWithChildren) {
  const [liked, setLiked] = useState<ReadonlySet<string>>(new Set());
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  // Evaluate and validate configuration before rendering any route.
  if (env.dataMode !== 'mock') throw new Error('Unsupported data mode');
  return (
    <SafeAreaProvider>
      <DemoContext.Provider
        value={{
          liked,
          saved,
          toggleLike: (id) => setLiked((s) => toggle(s, id)),
          toggleSave: (id) => setSaved((s) => toggle(s, id)),
        }}
      >
        <ThemeProvider>
          <MarketplaceProvider>{children}</MarketplaceProvider>
        </ThemeProvider>
      </DemoContext.Provider>
    </SafeAreaProvider>
  );
}
export function useDemoState() {
  const state = useContext(DemoContext);
  if (!state) throw new Error('Demo state requires AppProviders');
  return state;
}
