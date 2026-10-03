import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RECOMMENDATION_PREFERENCES,
  rankListings,
  type RecommendationEvent,
  type RecommendationListing,
  type RecommendationPreferences,
} from '../src/recommendations';

const NOW = '2026-09-24T12:00:00.000Z';

function listing(
  id: string,
  overrides: Partial<RecommendationListing> = {},
): RecommendationListing {
  return {
    id,
    title: 'Cavalo para venda',
    description: 'Animal anunciado com informações detalhadas para o comprador.',
    category: 'horse',
    priceInCents: 2_000_000,
    location: { city: 'Recife', state: 'PE' },
    seller: `Anunciante ${id}`,
    breed: 'mangalarga-marchador',
    publishedAt: NOW,
    ...overrides,
  };
}

function rank(
  catalog: readonly RecommendationListing[],
  preferences: Partial<RecommendationPreferences> = {},
  events: readonly RecommendationEvent[] = [],
) {
  return rankListings(catalog, {
    preferences: { ...DEFAULT_RECOMMENDATION_PREFERENCES, ...preferences },
    events,
    now: NOW,
  });
}

function event(listingId: string, type: RecommendationEvent['type'], at = NOW) {
  return { listingId, type, at };
}

describe('marketplace recommendations', () => {
  it('starts deterministically, favors recency and preserves the caller catalog', () => {
    const catalog = [
      listing('old', { publishedAt: '2026-01-01T12:00:00.000Z' }),
      listing('new-b'),
      listing('new-a'),
    ];
    const snapshot = structuredClone(catalog);
    expect(rank(catalog).map(({ listing: item }) => item.id)).toEqual(['new-a', 'new-b', 'old']);
    expect(rank([...catalog].reverse())).toEqual(rank(catalog));
    expect(catalog).toEqual(snapshot);
  });

  it('keeps independent customer preferences isolated between calls', () => {
    const catalog = [listing('mm'), listing('qm', { breed: 'quarto-de-milha' })];
    const firstProfile = { breeds: ['mangalarga-marchador'] as const };
    const initial = rank(catalog, { breeds: [...firstProfile.breeds] });
    expect(initial[0]?.listing.id).toBe('mm');
    expect(rank(catalog, { breeds: ['quarto-de-milha'] })[0]?.listing.id).toBe('qm');
    expect(rank(catalog, { breeds: [...firstProfile.breeds] })).toEqual(initial);
  });

  it('lets selected breeds and categories outweigh accumulated browsing behavior', () => {
    const selectedBreed = listing('chosen', {
      breed: 'quarto-de-milha',
      publishedAt: '2026-01-01T00:00:00.000Z',
    });
    const others = Array.from({ length: 40 }, (_, index) => listing(`browsed-${index}`));
    const events = others.map((item) => event(item.id, 'view'));
    expect(
      rank([selectedBreed, ...others], { breeds: ['quarto-de-milha'] }, events)[0],
    ).toMatchObject({
      listing: { id: 'chosen' },
      reason: 'Raça que você escolheu',
    });
    const service = listing('service', { category: 'service' });
    expect(rank([...others, service], { categories: ['service'] }, events)[0]?.listing.id).toBe(
      'service',
    );
  });

  it('uses state and an explicit budget without treating expensive listings as better', () => {
    const cheap = listing('cheap', { priceInCents: 1_000_000 });
    const expensive = listing('expensive', { priceInCents: 9_000_000 });
    expect(rank([cheap])[0]?.score).toBe(rank([expensive])[0]?.score);
    expect(rank([expensive, cheap], { maxPriceInCents: 2_000_000 })[0]).toMatchObject({
      listing: { id: 'cheap' },
      reason: 'Dentro do seu orçamento',
    });
    const nearby = listing('nearby', { location: { city: 'Belo Horizonte', state: 'MG' } });
    expect(rank([cheap, nearby], { state: ' mg ' })[0]?.listing.id).toBe('nearby');
  });

  it('handles prices on request without excluding them or generating invalid scores', () => {
    const result = rank([listing('unknown-price', { priceInCents: null }), listing('priced')], {
      maxPriceInCents: 1_000_000,
    });
    expect(result).toHaveLength(2);
    expect(result.every(({ score }) => Number.isFinite(score))).toBe(true);
  });

  it('weights a favorite more strongly than a view and removes its effect when unfavorited', () => {
    const catalog = [listing('viewed'), listing('favorite', { breed: 'quarto-de-milha' })];
    const viewed = event('viewed', 'view');
    const favorite = event('favorite', 'favorite');
    expect(rank(catalog, {}, [viewed, favorite])[0]).toMatchObject({
      listing: { id: 'favorite' },
      reason: 'Com base nos seus favoritos',
    });
    expect(rank(catalog, {}, [viewed])[0]?.listing.id).toBe('viewed');
  });

  it('does not let repeated visits or repeated favorite events dominate the feed', () => {
    const catalog = [listing('a'), listing('b', { breed: 'quarto-de-milha' })];
    for (const type of ['view', 'favorite'] as const) {
      const single = event('b', type);
      const repeated = Array.from({ length: 1_000 }, () => ({ ...single }));
      expect(rank(catalog, {}, repeated)).toEqual(rank(catalog, {}, [single]));
    }
    expect(rank(catalog, {}, [event('b', 'favorite'), event('b', 'view')])).toEqual(
      rank(catalog, {}, [event('b', 'favorite')]),
    );
  });

  it('gives recent interest more weight than old activity and ignores invalid/future signals', () => {
    const catalog = [
      listing('old-interest'),
      listing('recent-interest', { breed: 'quarto-de-milha' }),
    ];
    expect(
      rank(catalog, {}, [
        event('old-interest', 'favorite', '2025-09-24T12:00:00.000Z'),
        event('recent-interest', 'view'),
      ])[0]?.listing.id,
    ).toBe('recent-interest');
    expect(
      rank(catalog, {}, [
        event('old-interest', 'favorite', 'invalid'),
        event('old-interest', 'favorite', '2027-09-24T12:00:00.000Z'),
        event('missing-id', 'favorite'),
      ]),
    ).toEqual(rank(catalog));
  });

  it('excludes dismissed listings and removes their influence on recommendations', () => {
    const catalog = [listing('hidden'), listing('visible'), listing('another')];
    const dismissed = event('hidden', 'dismiss');
    const result = rank(catalog, {}, [event('hidden', 'favorite'), dismissed]);
    expect(result.map(({ listing: item }) => item.id)).not.toContain('hidden');
    expect(result).toEqual(rank(catalog, {}, [dismissed]));
  });

  it('switches personalization off completely while respecting explicit dismissals', () => {
    const catalog = [
      listing('old', { breed: 'quarto-de-milha', publishedAt: '2026-01-01T00:00:00.000Z' }),
      listing('new'),
      listing('hidden'),
    ];
    const preferences: Partial<RecommendationPreferences> = {
      personalized: false,
      breeds: ['quarto-de-milha'],
      categories: ['service'],
      state: 'MG',
      maxPriceInCents: 0,
    };
    const baseline = rank(catalog, { personalized: false }, [event('hidden', 'dismiss')]);
    expect(
      rank(catalog, preferences, [event('old', 'favorite'), event('hidden', 'dismiss')]),
    ).toEqual(baseline);
    expect(baseline.map(({ listing: item }) => item.id)).toEqual(['new', 'old']);
    expect(baseline[0]?.reason).toContain('Sem personalização');
  });

  it('introduces modest seller variety when listings are otherwise equally relevant', () => {
    const catalog = [
      listing('a', { seller: 'Mesmo vendedor' }),
      listing('b', { seller: 'Mesmo vendedor' }),
      listing('c', { seller: 'Outro vendedor' }),
    ];
    expect(rank(catalog).map(({ listing: item }) => item.id)).toEqual(['a', 'c', 'b']);
    expect(rank([...catalog].reverse())).toEqual(rank(catalog));
  });

  it('preserves extra listing properties for callers and rejects an invalid clock', () => {
    const enriched = { ...listing('horse'), registryNumber: 'ABQM-123' };
    const result = rankListings([enriched], {
      preferences: DEFAULT_RECOMMENDATION_PREFERENCES,
      events: [],
      now: new Date(NOW),
    });
    expect(result[0]?.listing.registryNumber).toBe('ABQM-123');
    expect(() =>
      rankListings([enriched], {
        preferences: DEFAULT_RECOMMENDATION_PREFERENCES,
        events: [],
        now: 'invalid',
      }),
    ).toThrow('data válida');
  });
});
