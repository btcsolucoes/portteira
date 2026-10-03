import { describe, expect, it } from 'vitest';
import {
  EVENTS,
  eventSummarySchema,
  HORSES,
  LISTINGS,
  SOCIAL_POSTS,
  MockHorseDataProvider,
  OFFICIAL_PROVIDER_STATUS,
  filterEvents,
  filterHorses,
  filterListings,
  horseSchema,
  makeHorseId,
  normalizeSearchText,
  paginateById,
  postAttachmentSchema,
  socialPostSchema,
  type PedigreeNode,
} from '../src';

describe('discovery filters', () => {
  it('matches Portuguese accents, case, whitespace and partial names', () => {
    expect(normalizeSearchText('  ÉGUA ÁRABE  ')).toBe('egua arabe');
    expect(filterEvents(EVENTS, { query: '  arabe  fonte ' }).map((event) => event.id)).toEqual([
      'event-arabe-fonte',
    ]);
    expect(
      filterListings(LISTINGS, { query: 'egua TORDILHA' }).map((listing) => listing.id),
    ).toEqual(['listing-marchadora']);
    expect(filterHorses(HORSES, { query: 'DEMO-MM-101' }).map((horse) => horse.externalId)).toEqual(
      ['mm-101'],
    );
  });

  it('combines query, breed and category with AND semantics', () => {
    expect(filterEvents(EVENTS, { query: 'serra', breed: 'arabe' })).toHaveLength(1);
    expect(filterEvents(EVENTS, { query: 'tambores', breed: 'arabe' })).toHaveLength(0);
    expect(
      filterListings(LISTINGS, {
        query: 'Gravatá',
        breed: 'mangalarga-marchador',
        category: 'horse',
      }),
    ).toHaveLength(1);
    expect(
      filterListings(LISTINGS, {
        query: 'Gravatá',
        breed: 'mangalarga-marchador',
        category: 'service',
      }),
    ).toHaveLength(0);
    expect(filterHorses(HORSES, { query: 'fonte', breed: 'arabe' })).toHaveLength(2);
    expect(filterHorses(HORSES, { query: 'fonte', breed: 'quarto-de-milha' })).toHaveLength(0);
  });

  it('returns an empty state for unmatched text without mutating fixtures', () => {
    const original = HORSES.map((horse) => horse.id);
    expect(filterHorses(HORSES, { query: 'nonexistent-demo-record' })).toEqual([]);
    expect(HORSES.map((horse) => horse.id)).toEqual(original);
  });
});

describe('fixture boundaries', () => {
  it('requires an event end strictly after its start', () => {
    const event = EVENTS[0]!;
    expect(eventSummarySchema.safeParse({ ...event, endsAt: event.startsAt }).success).toBe(false);
    expect(eventSummarySchema.safeParse(event).success).toBe(true);
  });
  it('makes fictional provenance explicit and resolves only supported social links', () => {
    for (const entry of [...EVENTS, ...LISTINGS, ...SOCIAL_POSTS, ...HORSES]) {
      expect(entry.provenance.kind).toBe('fictional');
      expect(entry.provenance.source).toBe('equestre-demo');
    }
    for (const post of SOCIAL_POSTS) {
      expect(socialPostSchema.safeParse(post).success).toBe(true);
      const attachment = post.attachment;
      expect(attachment).toBeDefined();
      if (attachment?.type === 'event')
        expect(EVENTS.some((event) => event.id === attachment.id)).toBe(true);
      if (attachment?.type === 'listing')
        expect(LISTINGS.some((listing) => listing.id === attachment.id)).toBe(true);
    }
    expect(OFFICIAL_PROVIDER_STATUS.every((source) => source.available === false)).toBe(true);
  });

  it('rejects a horse-database link and hidden extra fields on an attachment', () => {
    expect(
      postAttachmentSchema.safeParse({ type: 'horse', id: 'equestre-demo:mm-101' }).success,
    ).toBe(false);
    expect(
      postAttachmentSchema.safeParse({ type: 'event', id: 'event-vale-sereno', horseId: 'mm-101' })
        .success,
    ).toBe(false);
    expect(
      socialPostSchema.safeParse({
        ...SOCIAL_POSTS[0],
        attachment: { type: 'horse', id: 'equestre-demo:mm-101' },
      }).success,
    ).toBe(false);
  });

  it('forms identity from source and external ID without separator collisions', () => {
    expect(makeHorseId('source-a', '123')).not.toBe(makeHorseId('source-b', '123'));
    expect(makeHorseId('source:a', 'b')).not.toBe(makeHorseId('source', 'a:b'));
    expect(() => makeHorseId('', '123')).toThrow();
    expect(horseSchema.safeParse({ ...HORSES[0], id: 'mm-101' }).success).toBe(false);
    expect(horseSchema.safeParse(HORSES[0]).success).toBe(true);
  });
});

describe('deterministic cursor pagination', () => {
  it('sorts stably and traverses all filtered results without repetition', async () => {
    const provider = new MockHorseDataProvider({ horses: [...HORSES].reverse() });
    const first = await provider.search({ breed: 'arabe', limit: 1 });
    expect(first.total).toBe(2);
    expect(first.items).toHaveLength(1);
    expect(first.items[0]?.breed).toBe('arabe');
    expect(first.nextCursor).not.toBeNull();
    const second = await provider.search({
      breed: 'arabe',
      limit: 1,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.items[0]?.breed).toBe('arabe');
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
    expect(second.nextCursor).toBeNull();
    const ids = [...first.items, ...second.items].map((horse) => horse.id);
    expect(ids).toEqual(
      filterHorses(HORSES, { breed: 'arabe' })
        .map((horse) => horse.id)
        .sort(),
    );
  });

  it('binds a cursor to the filters, operation and result snapshot', async () => {
    const provider = new MockHorseDataProvider();
    const first = await provider.search({ breed: 'arabe', limit: 1 });
    const cursor = first.nextCursor ?? undefined;
    await expect(
      provider.search({ breed: 'quarto-de-milha', limit: 1, cursor }),
    ).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    await expect(
      provider.getOffspring(makeHorseId('equestre-demo', 'ar-301'), { cursor }),
    ).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    const differentSnapshot = new MockHorseDataProvider({
      horses: HORSES.filter((horse) => horse.externalId !== 'ar-302'),
    });
    await expect(
      differentSnapshot.search({ breed: 'arabe', limit: 1, cursor }),
    ).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
  });

  it('rejects malformed cursors, invalid limits and duplicate identities', () => {
    expect(() => paginateById(HORSES, { cursor: 'not-json' }, 'all')).toThrow(
      expect.objectContaining({ code: 'INVALID_CURSOR' }),
    );
    expect(() => paginateById(HORSES, { limit: 0 }, 'all')).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    );
    expect(() => paginateById(HORSES, { limit: 51 }, 'all')).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    );
    expect(() => paginateById([{ id: 'same' }, { id: 'same' }], {}, 'all')).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    );
    expect(paginateById([], {}, 'empty')).toEqual({ items: [], nextCursor: null, total: 0 });
  });
});

describe('mock horse provider', () => {
  it('supports lookup, known offspring and explicit absence', async () => {
    const provider = new MockHorseDataProvider();
    const atlasId = makeHorseId('equestre-demo', 'mm-101');
    expect((await provider.getById(atlasId)).name).toBe('Atlas do Vale Sereno');
    const offspring = await provider.getOffspring(atlasId);
    expect(offspring.items.map((horse) => horse.externalId)).toEqual(['mm-102']);
    expect(await provider.getOffspring(makeHorseId('equestre-demo', 'mm-102'))).toEqual({
      items: [],
      nextCursor: null,
      total: 0,
    });
    await expect(provider.getById('mm-101')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(provider.getById('other-source:mm-101')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(provider.getPedigree('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(provider.getOffspring('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns a bounded pedigree through great-grandparents and represents missing parents', async () => {
    const provider = new MockHorseDataProvider();
    const pedigree = await provider.getPedigree(makeHorseId('equestre-demo', 'mm-101'));
    const visited: PedigreeNode[] = [];
    const visit = (node: PedigreeNode) => {
      visited.push(node);
      if (node.sire) visit(node.sire);
      if (node.dam) visit(node.dam);
    };
    visit(pedigree.root);
    expect(visited).toHaveLength(15);
    expect(Math.max(...visited.map((node) => node.generation))).toBe(3);
    expect(
      visited.filter((node) => node.generation === 3).every((node) => !node.sire && !node.dam),
    ).toBe(true);
    const incomplete = await provider.getPedigree(makeHorseId('equestre-demo', 'ar-301'));
    expect(incomplete.root.sire?.sire?.horse).toBeNull();
  });

  it('stops cycles without inventing a repeated ancestor', async () => {
    const horse = HORSES[0];
    if (!horse) throw new Error('Fixture missing');
    const self = { id: horse.id, name: horse.name, registryNumber: horse.registryNumber };
    const provider = new MockHorseDataProvider({
      horses: [{ ...horse, sire: self }],
      ancestry: [],
    });
    const pedigree = await provider.getPedigree(horse.id);
    expect(pedigree.root.sire?.horse).toBeNull();
  });

  it('does not expose mutable provider data to consumers', async () => {
    const provider = new MockHorseDataProvider();
    const id = makeHorseId('equestre-demo', 'mm-101');
    const horse = await provider.getById(id);
    horse.name = 'Changed locally';
    horse.awards.push({ title: 'Not persisted', year: 2026 });
    expect((await provider.getById(id)).name).toBe('Atlas do Vale Sereno');
    expect((await provider.getById(id)).awards).toHaveLength(1);
  });

  it('returns explicit unavailable and invalid-input errors', async () => {
    const provider = new MockHorseDataProvider({ enabled: false });
    await expect(provider.search()).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    await expect(provider.getById('any')).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    await expect(
      new MockHorseDataProvider().search({ query: 'x'.repeat(201) }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  });

  it('cancels before starting and while a request is in flight', async () => {
    const preAborted = new AbortController();
    preAborted.abort();
    await expect(
      new MockHorseDataProvider().search({}, { signal: preAborted.signal }),
    ).rejects.toMatchObject({ code: 'ABORTED' });
    const controller = new AbortController();
    const pending = new MockHorseDataProvider({ latencyMs: 1000 }).search(
      {},
      { signal: controller.signal },
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'ABORTED' });
  });
});
