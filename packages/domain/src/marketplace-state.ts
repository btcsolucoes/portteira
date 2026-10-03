import { z } from 'zod';
import { breedSchema, listingCategorySchema } from './models';
import { BRAZIL_STATES, marketplaceListingSchema } from './marketplace';

export const marketplaceStateSchema = z
  .object({
    version: z.literal(1),
    listings: z
      .array(marketplaceListingSchema)
      .max(500)
      .refine(
        (items) => items.every((item) => item.provenance.kind === 'local'),
        'Somente anúncios locais são persistidos.',
      ),
    favoriteIds: z.array(z.string().min(1)).max(1000),
    preferences: z
      .object({
        breeds: z.array(breedSchema).max(3),
        categories: z.array(listingCategorySchema).max(4),
        state: z.enum(BRAZIL_STATES).optional(),
        maxPriceInCents: z.number().int().nonnegative().max(100_000_000_000).optional(),
        personalized: z.boolean(),
      })
      .strict(),
    events: z
      .array(
        z.object({
          listingId: z.string().min(1),
          type: z.enum(['view', 'favorite', 'dismiss']),
          at: z.iso.datetime(),
        }),
      )
      .max(500),
  })
  .strict();
export type MarketplaceState = z.infer<typeof marketplaceStateSchema>;
export function initialMarketplaceState(): MarketplaceState {
  return {
    version: 1,
    listings: [],
    favoriteIds: [],
    preferences: { breeds: [], categories: [], personalized: true },
    events: [],
  };
}

/** A bounded, deduplicated history: one event of each kind per listing. */
export function recordMarketplaceEvent(
  state: MarketplaceState,
  listingId: string,
  type: 'view' | 'favorite' | 'dismiss',
  at: string,
): MarketplaceState {
  if (type !== 'dismiss' && !state.preferences.personalized) return state;
  const events = [
    ...state.events.filter((event) => !(event.listingId === listingId && event.type === type)),
    { listingId, type, at },
  ];
  const dismissals = events.filter((event) => event.type === 'dismiss');
  if (dismissals.length > 500)
    throw new Error('Restaure alguns anúncios ocultos antes de ocultar mais.');
  const positiveLimit = 500 - dismissals.length;
  const positives =
    positiveLimit > 0
      ? events.filter((event) => event.type !== 'dismiss').slice(-positiveLimit)
      : [];
  return { ...state, events: [...dismissals, ...positives] };
}

export function toggleMarketplaceFavorite(
  state: MarketplaceState,
  listingId: string,
  at: string,
): MarketplaceState {
  if (state.favoriteIds.includes(listingId))
    return {
      ...state,
      favoriteIds: state.favoriteIds.filter((id) => id !== listingId),
      events: state.events.filter(
        (event) => event.listingId !== listingId || event.type !== 'favorite',
      ),
    };
  return recordMarketplaceEvent(
    {
      ...state,
      favoriteIds: [...state.favoriteIds, listingId],
      events: state.events.filter(
        (event) => event.listingId !== listingId || event.type !== 'dismiss',
      ),
    },
    listingId,
    'favorite',
    at,
  );
}
