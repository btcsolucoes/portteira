import { z } from 'zod';

export const associationIdSchema = z.enum(['ABCCMM', 'ABQM']);
export type AssociationId = z.infer<typeof associationIdSchema>;

const requiredText = z.string().trim().min(1).max(300);

/** A name is a search term, never the identity that authorizes a badge. */
export const associationAnimalIdentitySchema = z
  .object({
    association: associationIdSchema,
    registryNumber: z.string().trim().min(1).max(100),
  })
  .strict();
export type AssociationAnimalIdentity = z.infer<typeof associationAnimalIdentitySchema>;

export const associationAnimalSchema = z
  .object({ identity: associationAnimalIdentitySchema, name: requiredText })
  .strict();
export type AssociationAnimal = z.infer<typeof associationAnimalSchema>;

export function makeAssociationAnimalKey(identity: AssociationAnimalIdentity): string {
  const parsed = associationAnimalIdentitySchema.parse(identity);
  return `${parsed.association}:${encodeURIComponent(parsed.registryNumber)}`;
}

export function sameAssociationAnimal(
  left: AssociationAnimalIdentity,
  right: AssociationAnimalIdentity,
): boolean {
  return makeAssociationAnimalKey(left) === makeAssociationAnimalKey(right);
}

const officialDomains: Record<AssociationId, string> = {
  ABCCMM: 'abccmm.org.br',
  ABQM: 'abqm.com.br',
};

function hasOfficialSource(sourceUrl: string, association: AssociationId): boolean {
  try {
    const url = new URL(sourceUrl);
    const domain = officialDomains[association];
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    );
  } catch {
    return false;
  }
}

const evidenceFields = {
  identity: associationAnimalIdentitySchema,
  title: requiredText,
  sourceUrl: z.url(),
  checkedAt: z.iso.datetime({ offset: true }),
};

/**
 * Adapters must receive an explicitly awarded title from an authorized source.
 * There is deliberately no placement/name-to-champion conversion here.
 */
export const verifiedHorseBadgeSchema = z
  .discriminatedUnion('type', [
    z.object({ type: z.literal('registry'), ...evidenceFields }).strict(),
    z
      .object({
        type: z.literal('champion'),
        ...evidenceFields,
        event: requiredText,
        year: z.number().int().min(1800).max(9999),
        modality: requiredText,
        category: requiredText,
      })
      .strict(),
  ])
  .superRefine((badge, context) => {
    if (!hasOfficialSource(badge.sourceUrl, badge.identity.association)) {
      context.addIssue({
        code: 'custom',
        path: ['sourceUrl'],
        message: 'A evidência deve usar uma URL HTTPS oficial da associação do animal.',
      });
    }
    if (badge.type === 'champion' && badge.year > new Date(badge.checkedAt).getUTCFullYear()) {
      context.addIssue({
        code: 'custom',
        path: ['year'],
        message: 'A conquista não pode ser posterior à conferência da evidência.',
      });
    }
  });
export type VerifiedHorseBadge = z.infer<typeof verifiedHorseBadgeSchema>;

export const demoAnimalIdentitySchema = z
  .object({ association: z.literal('DEMO'), registryNumber: z.string().regex(/^DEMO-\d+$/) })
  .strict();
export type DemoAnimalIdentity = z.infer<typeof demoAnimalIdentitySchema>;
export const demoAssociationAnimalSchema = z
  .object({ identity: demoAnimalIdentitySchema, name: requiredText })
  .strict();
export type DemoAssociationAnimal = z.infer<typeof demoAssociationAnimalSchema>;

const noBadgesSchema = z.tuple([]);
const officialIdentityFields = {
  identity: associationAnimalIdentitySchema,
  badges: noBadgesSchema,
};

export const horseVerificationSchema = z
  .discriminatedUnion('status', [
    z.object({ status: z.literal('pending'), ...officialIdentityFields }).strict(),
    z
      .object({
        status: z.literal('unavailable'),
        ...officialIdentityFields,
        reason: z.enum(['access_not_configured', 'provider_unavailable']),
        message: requiredText,
      })
      .strict(),
    z
      .object({
        status: z.literal('unverified'),
        ...officialIdentityFields,
        reason: z.enum(['not_found', 'ambiguous_identity', 'no_official_evidence']),
        message: requiredText,
      })
      .strict(),
    z
      .object({
        status: z.literal('verified'),
        identity: associationAnimalIdentitySchema,
        provenance: z.literal('official'),
        badges: z.array(verifiedHorseBadgeSchema).min(1),
      })
      .strict(),
    z
      .object({
        status: z.literal('demo'),
        identity: demoAnimalIdentitySchema,
        provenance: z.literal('fictional'),
        badges: noBadgesSchema,
        message: requiredText,
      })
      .strict(),
  ])
  .superRefine((verification, context) => {
    if (verification.status !== 'verified') return;
    const uniqueBadges = new Set<string>();
    verification.badges.forEach((badge, index) => {
      if (!sameAssociationAnimal(verification.identity, badge.identity)) {
        context.addIssue({
          code: 'custom',
          path: ['badges', index, 'identity'],
          message: 'O selo precisa comprovar o mesmo registro e associação do animal.',
        });
      }
      const key = JSON.stringify(
        badge.type === 'registry'
          ? ['registry']
          : ['champion', badge.title, badge.event, badge.year, badge.modality, badge.category],
      );
      if (uniqueBadges.has(key)) {
        context.addIssue({
          code: 'custom',
          path: ['badges', index],
          message: 'A mesma comprovação não pode gerar selos duplicados.',
        });
      }
      uniqueBadges.add(key);
    });
  });
export type HorseVerification = z.infer<typeof horseVerificationSchema>;

/** Validates shape and linkage; it does not authenticate an external provider. */
export function validateHorseVerification(value: unknown): HorseVerification {
  return horseVerificationSchema.parse(value);
}

/**
 * Only use with results obtained from a trusted server-side adapter. This pure
 * function is a display guard, not proof that a user-supplied URL is authentic.
 * Passing the current identity also prevents a late result attaching to a new
 * selection. Fictional and incomplete evidence always yield an empty array.
 */
export function getEligibleHorseBadges(
  value: unknown,
  expectedIdentity: AssociationAnimalIdentity,
): VerifiedHorseBadge[] {
  const expected = associationAnimalIdentitySchema.safeParse(expectedIdentity);
  const parsed = horseVerificationSchema.safeParse(value);
  if (
    !expected.success ||
    !parsed.success ||
    parsed.data.status !== 'verified' ||
    !sameAssociationAnimal(parsed.data.identity, expected.data)
  ) {
    return [];
  }
  return parsed.data.badges;
}

export type AssociationSearchResult =
  | { status: 'available'; association: AssociationId; animals: AssociationAnimal[] }
  | {
      status: 'unavailable';
      association: AssociationId;
      animals: [];
      reason: 'access_not_configured';
      message: string;
    };

export interface AssociationProvider {
  readonly association: AssociationId;
  search(query: string, signal?: AbortSignal): Promise<AssociationSearchResult>;
  verify(identity: AssociationAnimalIdentity, signal?: AbortSignal): Promise<HorseVerification>;
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Consulta cancelada.', 'AbortError');
}

const associationQuerySchema = z.string().trim().max(200);

/** No network request is made until an authorized integration is implemented. */
export class UnavailableAssociationProvider implements AssociationProvider {
  readonly association: AssociationId;

  constructor(association: AssociationId) {
    this.association = associationIdSchema.parse(association);
  }

  async search(query: string, signal?: AbortSignal): Promise<AssociationSearchResult> {
    assertNotAborted(signal);
    associationQuerySchema.parse(query);
    return {
      status: 'unavailable',
      association: this.association,
      animals: [],
      reason: 'access_not_configured',
      message: this.message(),
    };
  }

  async verify(
    identity: AssociationAnimalIdentity,
    signal?: AbortSignal,
  ): Promise<HorseVerification> {
    assertNotAborted(signal);
    const parsed = associationAnimalIdentitySchema.parse(identity);
    if (parsed.association !== this.association) {
      throw new Error('A associação do animal não corresponde à fonte consultada.');
    }
    return {
      status: 'unavailable',
      identity: parsed,
      badges: [],
      reason: 'access_not_configured',
      message: this.message(),
    };
  }

  private message(): string {
    return `A consulta à ${this.association} ainda depende de acesso autorizado. O anúncio pode continuar sem selos verificados.`;
  }
}

export function createAssociationProvider(association: AssociationId): AssociationProvider {
  return new UnavailableAssociationProvider(association);
}

export type DemoAssociationSearchResult = {
  status: 'demo';
  animals: DemoAssociationAnimal[];
  message: string;
};

const demoMessage = 'Demonstração com animais fictícios. Nenhum registro ou título foi verificado.';
const demoAnimals: readonly DemoAssociationAnimal[] = [
  { identity: { association: 'DEMO', registryNumber: 'DEMO-001' }, name: 'Estrela Fictícia' },
  { identity: { association: 'DEMO', registryNumber: 'DEMO-002' }, name: 'Estrela Fictícia' },
  { identity: { association: 'DEMO', registryNumber: 'DEMO-003' }, name: 'Trovão Fictício' },
];

function normalizedQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

/** Intentionally does not implement AssociationProvider or impersonate a registry. */
export class DemoAssociationProvider {
  readonly association = 'DEMO' as const;

  async search(query: string, signal?: AbortSignal): Promise<DemoAssociationSearchResult> {
    assertNotAborted(signal);
    const normalized = normalizedQuery(associationQuerySchema.parse(query));
    const animals = demoAnimals
      .filter((animal) =>
        normalizedQuery(`${animal.name} ${animal.identity.registryNumber}`).includes(normalized),
      )
      .map((animal) => demoAssociationAnimalSchema.parse(animal));
    return { status: 'demo', animals, message: demoMessage };
  }

  async verify(identity: DemoAnimalIdentity, signal?: AbortSignal): Promise<HorseVerification> {
    assertNotAborted(signal);
    const parsed = demoAnimalIdentitySchema.parse(identity);
    if (!demoAnimals.some((animal) => animal.identity.registryNumber === parsed.registryNumber)) {
      throw new Error('Animal fictício não encontrado nesta demonstração.');
    }
    return {
      status: 'demo',
      identity: parsed,
      provenance: 'fictional',
      badges: [],
      message: demoMessage,
    };
  }
}
