import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  LISTINGS,
  initialMarketplaceState,
  marketplaceStateSchema,
  marketplaceListingSchema,
  newListingInputSchema,
  recordMarketplaceEvent,
  toggleMarketplaceFavorite,
  type MarketplaceState,
  type MarketplaceListing,
  type NewListingInput,
  type RecommendationPreferences,
} from '@equestre/domain';

const STORAGE_KEY = 'portteira.marketplace.v1';
const DEMO_LISTINGS = LISTINGS.map((listing) => marketplaceListingSchema.parse(listing));
type MarketplaceContextValue = {
  listings: MarketplaceListing[];
  state: MarketplaceState;
  ready: boolean;
  storageError: string | null;
  retryLoad: () => void;
  addListing: (input: NewListingInput) => Promise<MarketplaceListing>;
  toggleFavorite: (id: string) => void;
  recordView: (id: string) => void;
  dismissListing: (id: string) => Promise<void>;
  updatePreferences: (preferences: RecommendationPreferences) => Promise<void>;
  clearHistory: () => Promise<void>;
  restoreHidden: (id?: string) => Promise<void>;
  setListingStatus: (id: string, status: MarketplaceListing['status']) => void;
};
const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);
export function MarketplaceProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialMarketplaceState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const current = useRef(state);
  const writable = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const load = useCallback(async () => {
    writable.current = false;
    try {
      await queue.current;
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const loaded = raw
        ? marketplaceStateSchema.parse(JSON.parse(raw))
        : initialMarketplaceState();
      current.current = loaded;
      setState(loaded);
      writable.current = true;
      setStorageError(null);
    } catch {
      setStorageError(
        'Não foi possível carregar os dados deste aparelho. Seus dados salvos foram preservados.',
      );
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    // Initialize after any outstanding storage operation; state updates occur on completion.
    void queue.current.then(load);
  }, [load]);

  const update = useCallback((change: (previous: MarketplaceState) => MarketplaceState) => {
    const operation = queue.current.then(async () => {
      if (!writable.current) throw new Error('O armazenamento local ainda não está disponível.');
      const next = marketplaceStateSchema.parse(change(current.current));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      current.current = next;
      setState(next);
      setStorageError(null);
    });
    queue.current = operation.catch(() => {
      setStorageError('Não foi possível salvar. A alteração não foi aplicada. Tente novamente.');
    });
    return operation;
  }, []);
  const safelyUpdate = useCallback(
    (change: (previous: MarketplaceState) => MarketplaceState) => {
      void update(change).catch(() => undefined);
    },
    [update],
  );
  const addListing = useCallback(
    async (input: NewListingInput) => {
      const parsed = newListingInputSchema.parse(input);
      const now = new Date().toISOString();
      const listing: MarketplaceListing = {
        ...parsed,
        id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        currency: 'BRL',
        imageKey: 'pasture',
        status: 'active',
        publishedAt: now,
        provenance: { kind: 'local', label: 'Anúncio local · neste aparelho' },
      };
      await update((previous) => ({ ...previous, listings: [listing, ...previous.listings] }));
      return listing;
    },
    [update],
  );
  const recordView = useCallback(
    (id: string) => {
      if (!writable.current || !current.current.preferences.personalized) return;
      const previous = current.current.events.find(
        (event) => event.listingId === id && event.type === 'view',
      );
      if (previous && Date.now() - Date.parse(previous.at) < 60_000) return;
      safelyUpdate((s) => recordMarketplaceEvent(s, id, 'view', new Date().toISOString()));
    },
    [safelyUpdate],
  );
  return (
    <MarketplaceContext.Provider
      value={{
        listings: [...state.listings, ...DEMO_LISTINGS],
        state,
        ready,
        storageError,
        retryLoad: () => {
          setReady(false);
          void load();
        },
        addListing,
        recordView,
        toggleFavorite: (id) =>
          safelyUpdate((s) => toggleMarketplaceFavorite(s, id, new Date().toISOString())),
        dismissListing: (id) =>
          update((s) => recordMarketplaceEvent(s, id, 'dismiss', new Date().toISOString())),
        updatePreferences: (preferences) =>
          update((s) => ({
            ...s,
            preferences: marketplaceStateSchema.shape.preferences.parse(preferences),
            events: preferences.personalized
              ? s.events
              : s.events.filter((event) => event.type === 'dismiss'),
          })),
        clearHistory: () =>
          update((s) => ({ ...s, events: s.events.filter((event) => event.type === 'dismiss') })),
        restoreHidden: (id) =>
          update((s) => ({
            ...s,
            events: s.events.filter(
              (event) => event.type !== 'dismiss' || (id !== undefined && event.listingId !== id),
            ),
          })),
        setListingStatus: (id, status) =>
          safelyUpdate((s) => ({
            ...s,
            listings: s.listings.map((listing) =>
              listing.id === id ? { ...listing, status } : listing,
            ),
          })),
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}
export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error('Marketplace requires MarketplaceProvider');
  return context;
}
