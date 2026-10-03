import { z } from 'zod';

export const breedSchema = z.enum(['mangalarga-marchador', 'quarto-de-milha', 'arabe']);
export type Breed = z.infer<typeof breedSchema>;

export const BREEDS: readonly { id: Breed; label: string }[] = [
  { id: 'mangalarga-marchador', label: 'Mangalarga Marchador' },
  { id: 'quarto-de-milha', label: 'Quarto de Milha' },
  { id: 'arabe', label: 'Cavalo Árabe' },
];

export const imageKeySchema = z.enum(['pasture', 'portrait', 'arena']);
export type ImageKey = z.infer<typeof imageKeySchema>;

export const provenanceSchema = z
  .object({
    kind: z.literal('fictional'),
    source: z.literal('equestre-demo'),
    label: z.literal('Dado fictício · demonstração'),
  })
  .strict();

export type Provenance = z.infer<typeof provenanceSchema>;
export const DEMO_PROVENANCE: Provenance = {
  kind: 'fictional',
  source: 'equestre-demo',
  label: 'Dado fictício · demonstração',
};

export const locationSchema = z
  .object({
    city: z.string().min(1),
    state: z.string().length(2),
  })
  .strict();
export type Location = z.infer<typeof locationSchema>;

export const eventSummarySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    location: locationSchema,
    venue: z.string().min(1),
    organizer: z.string().min(1),
    category: z.enum(['competition', 'exhibition', 'auction', 'gathering']),
    modality: z.string().min(1),
    breeds: z.array(breedSchema).min(1),
    imageKey: imageKeySchema,
    provenance: provenanceSchema,
  })
  .strict()
  .refine((event) => Date.parse(event.endsAt) > Date.parse(event.startsAt), {
    message: 'O encerramento deve ser posterior ao início do evento.',
    path: ['endsAt'],
  });
export type EventSummary = z.infer<typeof eventSummarySchema>;

export const listingCategorySchema = z.enum(['horse', 'equipment', 'product', 'service']);
export type ListingCategory = z.infer<typeof listingCategorySchema>;
export const LISTING_CATEGORIES: readonly { id: ListingCategory; label: string }[] = [
  { id: 'horse', label: 'Cavalos' },
  { id: 'equipment', label: 'Equipamentos' },
  { id: 'product', label: 'Produtos' },
  { id: 'service', label: 'Serviços' },
];

export const listingSummarySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    category: listingCategorySchema,
    priceInCents: z.number().int().nonnegative().nullable(),
    currency: z.literal('BRL'),
    location: locationSchema,
    seller: z.string().min(1),
    breed: breedSchema.optional(),
    imageKey: imageKeySchema,
    status: z.literal('active'),
    publishedAt: z.iso.datetime({ offset: true }),
    provenance: provenanceSchema,
  })
  .strict();
export type ListingSummary = z.infer<typeof listingSummarySchema>;

// The allowed cross-module links are deliberately closed. A horse-database link
// cannot be introduced through an unvalidated extra field or a widened string.
export const postAttachmentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('event'), id: z.string().min(1) }).strict(),
  z.object({ type: z.literal('listing'), id: z.string().min(1) }).strict(),
]);
export type PostAttachment = z.infer<typeof postAttachmentSchema>;

export const socialPostSchema = z
  .object({
    id: z.string().min(1),
    author: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        subtitle: z.string().min(1),
        initials: z.string().min(1).max(3),
      })
      .strict(),
    body: z.string().min(1),
    publishedAt: z.iso.datetime({ offset: true }),
    imageKey: imageKeySchema.optional(),
    likes: z.number().int().nonnegative(),
    comments: z.number().int().nonnegative(),
    attachment: postAttachmentSchema.optional(),
    provenance: provenanceSchema,
  })
  .strict();
export type SocialPost = z.infer<typeof socialPostSchema>;

/** Stable identity is the pair (source, externalId), never the external ID alone. */
export function makeHorseId(source: string, externalId: string): string {
  if (!source.trim() || !externalId.trim()) {
    throw new Error('A identidade do animal exige fonte e identificador externo.');
  }
  return `${encodeURIComponent(source)}:${encodeURIComponent(externalId)}`;
}

export const horseReferenceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    registryNumber: z.string().min(1),
  })
  .strict();
export type HorseReference = z.infer<typeof horseReferenceSchema>;

export const horseSchema = z
  .object({
    id: z.string().min(1),
    externalSource: z.string().min(1),
    externalId: z.string().min(1),
    registryNumber: z.string().min(1),
    name: z.string().min(1),
    breed: breedSchema,
    sex: z.enum(['male', 'female', 'gelding']),
    birthDate: z.iso.date(),
    coat: z.string().min(1),
    location: locationSchema,
    breeder: z.string().min(1),
    owner: z.string().min(1).optional(),
    sire: horseReferenceSchema.nullable(),
    dam: horseReferenceSchema.nullable(),
    awards: z.array(z.object({ title: z.string().min(1), year: z.number().int() }).strict()),
    results: z.array(
      z
        .object({
          event: z.string().min(1),
          date: z.iso.date(),
          placement: z.number().int().positive(),
        })
        .strict(),
    ),
    lineage: z.string().min(1),
    imageKey: imageKeySchema,
    provenance: provenanceSchema,
  })
  .strict()
  .refine((horse) => horse.id === makeHorseId(horse.externalSource, horse.externalId), {
    message: 'A identidade do animal deve combinar a fonte e o identificador externo.',
    path: ['id'],
  });
export type Horse = z.infer<typeof horseSchema>;

export type PedigreeGeneration = 0 | 1 | 2 | 3;
export interface PedigreeNode {
  horse: HorseReference | null;
  generation: PedigreeGeneration;
  sire?: PedigreeNode;
  dam?: PedigreeNode;
}
export interface HorsePedigree {
  horseId: string;
  maxGenerations: 3;
  root: PedigreeNode;
  provenance: Provenance;
}
