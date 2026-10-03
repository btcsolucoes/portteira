import { z } from 'zod';
import {
  breedSchema,
  listingCategorySchema,
  listingSummarySchema,
  provenanceSchema,
} from './models';

export const BRAZIL_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;
export const listingHorseSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    association: z.enum(['ABCCMM', 'ABQM']),
    registryNumber: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

const inputFields = {
  title: z.string().trim().min(3, 'Informe um título com pelo menos 3 caracteres.').max(120),
  description: z
    .string()
    .trim()
    .min(10, 'Descreva o anúncio com pelo menos 10 caracteres.')
    .max(4000),
  category: listingCategorySchema,
  priceInCents: z.number().int().nonnegative().max(100_000_000_000).nullable(),
  location: z
    .object({ city: z.string().trim().min(2).max(100), state: z.enum(BRAZIL_STATES) })
    .strict(),
  seller: z.string().trim().min(2).max(100),
  breed: breedSchema.optional(),
  horse: listingHorseSchema.optional(),
};
export const newListingInputSchema = z
  .object(inputFields)
  .strict()
  .superRefine((input, ctx) => {
    if (input.category === 'horse') {
      if (!input.horse)
        ctx.addIssue({ code: 'custom', path: ['horse'], message: 'Informe o animal do anúncio.' });
      const expected =
        input.horse?.association === 'ABCCMM' ? 'mangalarga-marchador' : 'quarto-de-milha';
      if (input.breed !== expected)
        ctx.addIssue({
          code: 'custom',
          path: ['breed'],
          message: 'Confira a raça e a associação do animal.',
        });
    } else if (input.horse || input.breed) {
      ctx.addIssue({
        code: 'custom',
        path: ['category'],
        message: 'Dados de animal pertencem à categoria Cavalos.',
      });
    }
  });
export type NewListingInput = z.infer<typeof newListingInputSchema>;

export const marketplaceListingSchema = listingSummarySchema
  .extend({
    ...inputFields,
    status: z.enum(['active', 'paused', 'sold']),
    provenance: z.union([
      provenanceSchema,
      z
        .object({ kind: z.literal('local'), label: z.literal('Anúncio local · neste aparelho') })
        .strict(),
    ]),
    horse: listingHorseSchema.optional(),
  })
  .strict()
  .superRefine((listing, ctx) => {
    if (listing.provenance.kind !== 'local') return;
    const input = newListingInputSchema.safeParse({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      priceInCents: listing.priceInCents,
      location: listing.location,
      seller: listing.seller,
      breed: listing.breed,
      horse: listing.horse,
    });
    if (!input.success)
      for (const issue of input.error.issues)
        ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message });
  });
export type MarketplaceListing = z.infer<typeof marketplaceListingSchema>;

/** Accept Brazilian amounts, rejecting ambiguous/malformed input instead of guessing. */
export function parseBRLPrice(input: string): number | null {
  const value = input.trim().replace(/^R\$\s*/, '');
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.replace(/\./g, '').split(',');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= 100_000_000_000 ? cents : null;
}
