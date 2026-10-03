import { describe, expect, it, vi } from 'vitest';
import {
  associationAnimalIdentitySchema,
  createAssociationProvider,
  DemoAssociationProvider,
  getEligibleHorseBadges,
  horseVerificationSchema,
  makeAssociationAnimalKey,
  sameAssociationAnimal,
  validateHorseVerification,
  verifiedHorseBadgeSchema,
  type AssociationAnimalIdentity,
  type HorseVerification,
  type VerifiedHorseBadge,
} from '../src/association-verification';

const identity: AssociationAnimalIdentity = { association: 'ABCCMM', registryNumber: '001234' };
// These are synthetic unit-test evidence objects, never fixture or provider data.
const registryBadge: VerifiedHorseBadge = {
  type: 'registry',
  identity,
  title: 'Registro confirmado (teste)',
  sourceUrl: 'https://abccmm.org.br/animais',
  checkedAt: '2026-09-24T12:00:00Z',
};
const championBadge: VerifiedHorseBadge = {
  type: 'champion',
  identity,
  title: 'Campeão da categoria (teste)',
  event: 'Evento de teste',
  year: 2025,
  modality: 'Marcha de teste',
  category: 'Categoria de teste',
  sourceUrl: 'https://resultados.abccmm.org.br/Resultados.aspx',
  checkedAt: '2026-09-24T12:00:00Z',
};
const verified: HorseVerification = {
  status: 'verified',
  identity,
  provenance: 'official',
  badges: [registryBadge, championBadge],
};

describe('association identity and evidence', () => {
  it('requires association and registry, preserving leading zeros and association scope', () => {
    expect(associationAnimalIdentitySchema.safeParse({ name: 'Um nome' }).success).toBe(false);
    expect(associationAnimalIdentitySchema.safeParse({ association: 'ABQM' }).success).toBe(false);
    expect(makeAssociationAnimalKey(identity)).toBe('ABCCMM:001234');
    expect(sameAssociationAnimal(identity, { ...identity, association: 'ABQM' })).toBe(false);
    expect(sameAssociationAnimal(identity, { ...identity, registryNumber: '1234' })).toBe(false);
  });

  it('accepts individually evidenced badges for the selected identity', () => {
    expect(validateHorseVerification(verified)).toEqual(verified);
    expect(getEligibleHorseBadges(verified, identity)).toEqual([registryBadge, championBadge]);
  });

  it('does not attach a late verification to a different selection', () => {
    expect(getEligibleHorseBadges(verified, { ...identity, registryNumber: '002222' })).toEqual([]);
    expect(getEligibleHorseBadges(verified, { ...identity, association: 'ABQM' })).toEqual([]);
  });

  it('rejects evidence about a different animal or association', () => {
    for (const otherIdentity of [
      { ...identity, registryNumber: '999' },
      { ...identity, association: 'ABQM' as const },
    ]) {
      const value = { ...verified, badges: [{ ...championBadge, identity: otherIdentity }] };
      expect(horseVerificationSchema.safeParse(value).success).toBe(false);
      expect(getEligibleHorseBadges(value, identity)).toEqual([]);
    }
  });

  it('does not infer a champion from a name, a first placement, or incomplete award evidence', () => {
    expect(getEligibleHorseBadges({ name: 'Campeão', placement: 1 }, identity)).toEqual([]);
    const withoutCategory = { ...championBadge, category: undefined };
    expect(verifiedHorseBadgeSchema.safeParse(withoutCategory).success).toBe(false);
    expect(verifiedHorseBadgeSchema.safeParse({ ...registryBadge, placement: 1 }).success).toBe(
      false,
    );
    expect(horseVerificationSchema.safeParse({ ...verified, badges: [] }).success).toBe(false);
  });

  it('rejects duplicate badges, invalid dates and titles after the evidence date', () => {
    expect(
      horseVerificationSchema.safeParse({ ...verified, badges: [championBadge, championBadge] })
        .success,
    ).toBe(false);
    expect(
      verifiedHorseBadgeSchema.safeParse({ ...championBadge, checkedAt: 'yesterday' }).success,
    ).toBe(false);
    expect(verifiedHorseBadgeSchema.safeParse({ ...championBadge, year: 2027 }).success).toBe(
      false,
    );
  });

  it.each([
    'https://abqm.com.br/animal',
    'https://abccmm.org.br.example.com/animal',
    'https://fakeabccmm.org.br/animal',
    'http://abccmm.org.br/animal',
    'https://user:password@abccmm.org.br/animal',
    'javascript:alert(1)',
  ])('rejects an unofficial or unsafe evidence URL: %s', (sourceUrl) => {
    expect(verifiedHorseBadgeSchema.safeParse({ ...registryBadge, sourceUrl }).success).toBe(false);
  });

  it('allows the ABQM official domain only for an ABQM identity', () => {
    const badge = {
      ...registryBadge,
      identity: { association: 'ABQM', registryNumber: '001234' },
      sourceUrl: 'https://consulta.abqm.com.br/animal',
    };
    expect(verifiedHorseBadgeSchema.safeParse(badge).success).toBe(true);
  });

  it.each([
    { status: 'pending', identity, badges: [] },
    {
      status: 'unverified',
      identity,
      badges: [],
      reason: 'not_found',
      message: 'Sem comprovação oficial.',
    },
    {
      status: 'unavailable',
      identity,
      badges: [],
      reason: 'provider_unavailable',
      message: 'Fonte indisponível.',
    },
  ])('never exposes badges in $status state', (value) => {
    expect(horseVerificationSchema.safeParse(value).success).toBe(true);
    expect(getEligibleHorseBadges(value, identity)).toEqual([]);
    expect(horseVerificationSchema.safeParse({ ...value, badges: [registryBadge] }).success).toBe(
      false,
    );
  });
});

describe('association provider boundaries', () => {
  it.each(['ABCCMM', 'ABQM'] as const)(
    'keeps %s explicitly unavailable without an authorized integration or network request',
    async (association) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network'));
      try {
        const provider = createAssociationProvider(association);
        const result = await provider.search('Estrela');
        expect(result).toMatchObject({
          status: 'unavailable',
          association,
          reason: 'access_not_configured',
          animals: [],
        });
        const verification = await provider.verify({ association, registryNumber: '001234' });
        expect(verification).toMatchObject({
          status: 'unavailable',
          reason: 'access_not_configured',
          badges: [],
        });
        expect(horseVerificationSchema.safeParse(verification).success).toBe(true);
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    },
  );

  it('rejects cross-association verification and honors cancellation', async () => {
    const provider = createAssociationProvider('ABQM');
    await expect(provider.verify(identity)).rejects.toThrow('não corresponde');
    const controller = new AbortController();
    controller.abort();
    await expect(provider.search('Estrela', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(
      provider.verify({ association: 'ABQM', registryNumber: '001' }, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('keeps fictional homonyms selectable by distinct demo records and never grants badges', async () => {
    const provider = new DemoAssociationProvider();
    const result = await provider.search('estrela ficticia');
    expect(provider.association).toBe('DEMO');
    expect(result.status).toBe('demo');
    expect(result.animals).toHaveLength(2);
    expect(result.animals[0]!.name).toBe(result.animals[1]!.name);
    expect(result.animals[0]!.identity).not.toEqual(result.animals[1]!.identity);
    for (const animal of result.animals) {
      const verification = await provider.verify(animal.identity);
      expect(verification).toMatchObject({ status: 'demo', provenance: 'fictional', badges: [] });
      expect(horseVerificationSchema.safeParse(verification).success).toBe(true);
      expect(getEligibleHorseBadges(verification, identity)).toEqual([]);
      expect(
        horseVerificationSchema.safeParse({ ...verification, status: 'verified' }).success,
      ).toBe(false);
      expect(associationAnimalIdentitySchema.safeParse(animal.identity).success).toBe(false);
    }
  });

  it('does not leak mutable demo records or invent matches', async () => {
    const provider = new DemoAssociationProvider();
    const result = await provider.search('DEMO-003');
    result.animals[0]!.name = 'Mutated';
    expect((await provider.search('DEMO-003')).animals[0]!.name).toBe('Trovão Fictício');
    expect((await provider.search('does-not-exist')).animals).toEqual([]);
    await expect(
      provider.verify({ association: 'DEMO', registryNumber: 'DEMO-999' }),
    ).rejects.toThrow('não encontrado');
  });
});
