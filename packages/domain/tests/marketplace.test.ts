import { describe, expect, it } from 'vitest';
import {
  marketplaceListingSchema,
  newListingInputSchema,
  parseBRLPrice,
  type MarketplaceListing,
  type NewListingInput,
} from '../src/marketplace';
import {
  initialMarketplaceState,
  marketplaceStateSchema,
  recordMarketplaceEvent,
  toggleMarketplaceFavorite,
  type MarketplaceState,
} from '../src/marketplace-state';
import { DEMO_PROVENANCE } from '../src/models';
import { LISTINGS } from '../src/fixtures';

const NOW = '2026-09-24T12:00:00.000Z';

function horseInput(overrides: Partial<NewListingInput> = {}): NewListingInput {
  return {
    title: 'Égua para venda',
    description: 'Égua marchadora anunciada pelo proprietário.',
    category: 'horse',
    priceInCents: 2_000_000,
    location: { city: 'Belo Horizonte', state: 'MG' },
    seller: 'Haras Exemplo',
    breed: 'mangalarga-marchador',
    horse: { name: 'Égua Exemplo', association: 'ABCCMM' },
    ...overrides,
  };
}

function localListing(overrides: Partial<MarketplaceListing> = {}): MarketplaceListing {
  return {
    ...horseInput(),
    id: 'local-1',
    currency: 'BRL',
    imageKey: 'pasture',
    status: 'active',
    publishedAt: NOW,
    provenance: { kind: 'local', label: 'Anúncio local · neste aparelho' },
    ...overrides,
  };
}

describe('Brazilian currency input', () => {
  it.each([
    ['45.000,00', 4_500_000],
    ['45000', 4_500_000],
    ['1.234,56', 123_456],
    ['1234,5', 123_450],
    ['  R$ 1.234,56  ', 123_456],
    ['R$10', 1_000],
    ['0', 0],
    ['0,01', 1],
    ['1.000.000.000,00', 100_000_000_000],
  ])('parses %s into integer cents', (input, expected) => {
    expect(parseBRLPrice(input)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    'R$',
    'sob consulta',
    '-1,00',
    '1,234.56',
    '12.34',
    '1.23.456',
    '1,000',
    '1.000,123',
    '1e6',
    'Infinity',
    '10 000,00',
    '10,',
    '1.000.000.000,01',
    '999999999999999999999999999',
  ])('rejects malformed, ambiguous or excessive price %s', (input) => {
    expect(parseBRLPrice(input)).toBeNull();
  });
});

describe('new marketplace listings', () => {
  it('accepts each supported breed only with its association', () => {
    expect(newListingInputSchema.safeParse(horseInput()).success).toBe(true);
    expect(
      newListingInputSchema.safeParse(
        horseInput({
          breed: 'quarto-de-milha',
          horse: { name: 'Quarto de Milha Exemplo', association: 'ABQM' },
        }),
      ).success,
    ).toBe(true);
    expect(
      newListingInputSchema.safeParse(
        horseInput({ horse: { name: 'Animal Exemplo', association: 'ABQM' } }),
      ).success,
    ).toBe(false);
    expect(newListingInputSchema.safeParse(horseInput({ breed: 'arabe' })).success).toBe(false);
    const { horse: _horse, ...withoutHorse } = horseInput();
    const { breed: _breed, ...withoutBreed } = horseInput();
    expect(newListingInputSchema.safeParse(withoutHorse).success).toBe(false);
    expect(newListingInputSchema.safeParse(withoutBreed).success).toBe(false);
  });

  it('allows an unregistered animal without granting or accepting a champion badge', () => {
    const parsed = newListingInputSchema.parse(horseInput());
    expect(parsed.horse).toEqual({ name: 'Égua Exemplo', association: 'ABCCMM' });
    expect(parsed).not.toHaveProperty('badges');
    expect(newListingInputSchema.safeParse({ ...horseInput(), badges: ['champion'] }).success).toBe(
      false,
    );
    expect(
      newListingInputSchema.safeParse({
        ...horseInput(),
        horse: { name: 'Animal Exemplo', association: 'ABCCMM', champion: true },
      }).success,
    ).toBe(false);
    expect(
      newListingInputSchema.safeParse(
        horseInput({
          horse: { name: 'Animal Exemplo', association: 'ABCCMM', registryNumber: '' },
        }),
      ).success,
    ).toBe(false);
  });

  it.each(['equipment', 'product', 'service'] as const)(
    'does not carry horse identification into category %s',
    (category) => {
      const { horse: _horse, breed: _breed, ...base } = horseInput();
      const input = { ...base, category };
      const parsed = newListingInputSchema.parse(input);
      expect(parsed).not.toHaveProperty('horse');
      expect(parsed).not.toHaveProperty('breed');
      expect(newListingInputSchema.safeParse({ ...input, horse: horseInput().horse }).success).toBe(
        false,
      );
      expect(
        newListingInputSchema.safeParse({ ...input, breed: 'mangalarga-marchador' }).success,
      ).toBe(false);
    },
  );

  it('trims text, allows a price on request and rejects incomplete or invalid input', () => {
    const parsed = newListingInputSchema.parse(
      horseInput({ title: '  Égua para venda  ', priceInCents: null }),
    );
    expect(parsed.title).toBe('Égua para venda');
    expect(parsed.priceInCents).toBeNull();
    for (const overrides of [
      { title: '  ' },
      { description: 'Breve' },
      { seller: ' ' },
      { priceInCents: -1 },
      { priceInCents: 1.5 },
      { priceInCents: 100_000_000_001 },
      { location: { city: 'Belo Horizonte', state: 'ZZ' } },
    ]) {
      expect(newListingInputSchema.safeParse({ ...horseInput(), ...overrides }).success).toBe(
        false,
      );
    }
  });
});

describe('persisted marketplace state', () => {
  it('keeps every existing fictional example valid without requiring association identity', () => {
    expect(LISTINGS.length).toBeGreaterThan(0);
    for (const example of LISTINGS) {
      expect(marketplaceListingSchema.safeParse(example).success).toBe(true);
    }
  });

  it('starts fresh for each profile and round-trips local listing status and preferences', () => {
    const first = initialMarketplaceState();
    first.favoriteIds.push('only-this-profile');
    expect(initialMarketplaceState().favoriteIds).toEqual([]);
    const state: MarketplaceState = {
      ...initialMarketplaceState(),
      listings: [
        localListing({ status: 'paused' }),
        localListing({ id: 'local-2', status: 'sold' }),
      ],
      preferences: {
        breeds: ['quarto-de-milha'],
        categories: ['horse'],
        state: 'MG',
        maxPriceInCents: 4_500_000,
        personalized: true,
      },
    };
    expect(marketplaceStateSchema.parse(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it('persists only local listings and rejects badges supplied by the client', () => {
    const fictional = { ...localListing(), provenance: DEMO_PROVENANCE };
    expect(marketplaceListingSchema.safeParse(fictional).success).toBe(true);
    expect(
      marketplaceStateSchema.safeParse({ ...initialMarketplaceState(), listings: [fictional] })
        .success,
    ).toBe(false);
    expect(
      marketplaceStateSchema.safeParse({
        ...initialMarketplaceState(),
        listings: [{ ...localListing(), badges: [{ type: 'champion', verified: true }] }],
      }).success,
    ).toBe(false);
  });

  it('applies input bounds and horse identity rules when loading local listings', () => {
    const local = localListing();
    const { horse: _horse, ...withoutHorse } = local;
    const invalidListings = [
      { ...local, priceInCents: 100_000_000_001 },
      { ...local, location: { city: 'Belo Horizonte', state: 'ZZ' } },
      { ...local, title: ' ' },
      { ...local, description: 'Breve' },
      { ...local, breed: 'quarto-de-milha' },
      { ...local, category: 'equipment' },
      withoutHorse,
    ];
    for (const invalid of invalidListings) {
      expect(
        marketplaceStateSchema.safeParse({ ...initialMarketplaceState(), listings: [invalid] })
          .success,
      ).toBe(false);
    }
  });

  it('rejects unknown versions, malformed events and invalid saved preference values', () => {
    const fresh = initialMarketplaceState();
    expect(marketplaceStateSchema.safeParse({ ...fresh, version: 2 }).success).toBe(false);
    expect(
      marketplaceStateSchema.safeParse({
        ...fresh,
        events: [{ listingId: 'local-1', type: 'view', at: 'invalid' }],
      }).success,
    ).toBe(false);
    for (const preferences of [
      { ...fresh.preferences, state: 'ZZ' },
      { ...fresh.preferences, maxPriceInCents: -1 },
      { ...fresh.preferences, maxPriceInCents: 100_000_000_001 },
    ]) {
      expect(marketplaceStateSchema.safeParse({ ...fresh, preferences }).success).toBe(false);
    }
  });
});

describe('customer interest history', () => {
  it('preserves an explicit dismissal when the browsing history reaches its limit', () => {
    let state = recordMarketplaceEvent(initialMarketplaceState(), 'hidden', 'dismiss', NOW);
    for (let index = 0; index < 501; index += 1)
      state = recordMarketplaceEvent(state, `view-${index}`, 'view', NOW);
    expect(state.events).toHaveLength(500);
    expect(
      state.events.some((event) => event.type === 'dismiss' && event.listingId === 'hidden'),
    ).toBe(true);
    expect(marketplaceStateSchema.safeParse(state).success).toBe(true);
  });
  it('deduplicates each event kind by listing while updating the observation time', () => {
    const initial = initialMarketplaceState();
    const visited = recordMarketplaceEvent(initial, 'a', 'view', '2026-09-24T11:00:00.000Z');
    const favored = recordMarketplaceEvent(visited, 'a', 'favorite', NOW);
    const revisited = recordMarketplaceEvent(favored, 'a', 'view', NOW);
    expect(revisited.events).toHaveLength(2);
    expect(revisited.events.find((event) => event.type === 'view')?.at).toBe(NOW);
    expect(revisited.events.find((event) => event.type === 'favorite')?.listingId).toBe('a');
    expect(initial.events).toEqual([]);
    expect(visited.events[0]?.at).toBe('2026-09-24T11:00:00.000Z');
  });

  it('bounds browsing history and preserves the newest observation', () => {
    let state = initialMarketplaceState();
    for (let index = 0; index < 501; index += 1) {
      state = recordMarketplaceEvent(state, `listing-${index}`, 'view', NOW);
    }
    expect(state.events).toHaveLength(500);
    expect(state.events[0]?.listingId).toBe('listing-1');
    expect(state.events.at(-1)?.listingId).toBe('listing-500');
    expect(marketplaceStateSchema.safeParse(state).success).toBe(true);
  });

  it('does not collect positive interests after opting out but keeps explicit dismissals', () => {
    const optedOut = initialMarketplaceState();
    optedOut.preferences.personalized = false;
    expect(recordMarketplaceEvent(optedOut, 'a', 'view', NOW)).toBe(optedOut);
    expect(recordMarketplaceEvent(optedOut, 'a', 'favorite', NOW)).toBe(optedOut);
    expect(recordMarketplaceEvent(optedOut, 'a', 'dismiss', NOW).events).toEqual([
      { listingId: 'a', type: 'dismiss', at: NOW },
    ]);
  });

  it('adds a favorite once and removes its recommendation signal when unfavoriting', () => {
    const initial = recordMarketplaceEvent(initialMarketplaceState(), 'a', 'view', NOW);
    const favorited = toggleMarketplaceFavorite(initial, 'a', NOW);
    expect(favorited.favoriteIds).toEqual(['a']);
    expect(favorited.events.filter((event) => event.type === 'favorite')).toEqual([
      { listingId: 'a', type: 'favorite', at: NOW },
    ]);
    const unfavorited = toggleMarketplaceFavorite(favorited, 'a', NOW);
    expect(unfavorited.favoriteIds).toEqual([]);
    expect(unfavorited.events).toEqual(initial.events);
    expect(favorited.favoriteIds).toEqual(['a']);
  });

  it('allows favorite management without collecting recommendation events after opt-out', () => {
    const initial = initialMarketplaceState();
    initial.preferences.personalized = false;
    const favorited = toggleMarketplaceFavorite(initial, 'a', NOW);
    expect(favorited.favoriteIds).toEqual(['a']);
    expect(favorited.events).toEqual([]);
    expect(toggleMarketplaceFavorite(favorited, 'a', NOW).favoriteIds).toEqual([]);
  });
});
