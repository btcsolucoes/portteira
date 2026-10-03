import { z } from 'zod';
import { HORSES, MOCK_ANCESTRY, type AncestryRecord } from './fixtures';
import {
  breedSchema,
  DEMO_PROVENANCE,
  horseSchema,
  type Horse,
  type HorsePedigree,
  type HorseReference,
  type PedigreeGeneration,
  type PedigreeNode,
} from './models';
import { filterHorses, normalizeSearchText, type SearchFilters } from './search';

export interface PaginationRequest {
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export interface HorseSearchRequest extends PaginationRequest, SearchFilters {}
export interface ProviderContext {
  signal?: AbortSignal | undefined;
}
export interface HorseProviderCapabilities {
  search: boolean;
  getById: boolean;
  pedigree: boolean;
  offspring: boolean;
}

export interface HorseDataProvider {
  readonly source: string;
  readonly capabilities: Readonly<HorseProviderCapabilities>;
  search(request?: HorseSearchRequest, context?: ProviderContext): Promise<Page<Horse>>;
  getById(id: string, context?: ProviderContext): Promise<Horse>;
  getPedigree(id: string, context?: ProviderContext): Promise<HorsePedigree>;
  getOffspring(
    id: string,
    request?: PaginationRequest,
    context?: ProviderContext,
  ): Promise<Page<Horse>>;
}

export type HorseProviderErrorCode =
  'PROVIDER_UNAVAILABLE' | 'NOT_FOUND' | 'ABORTED' | 'INVALID_CURSOR' | 'INVALID_REQUEST';

export class HorseProviderError extends Error {
  readonly code: HorseProviderErrorCode;
  readonly source: string;

  constructor(code: HorseProviderErrorCode, message: string, source = 'equestre-demo') {
    super(message);
    this.name = 'HorseProviderError';
    this.code = code;
    this.source = source;
  }
}

export const OFFICIAL_PROVIDER_STATUS = [
  {
    id: 'abccmm',
    name: 'ABCCMM',
    breed: 'mangalarga-marchador',
    available: false,
    reason: 'Integração indisponível. Depende de API, parceria ou importação autorizada.',
  },
  {
    id: 'abqm',
    name: 'ABQM',
    breed: 'quarto-de-milha',
    available: false,
    reason: 'Integração indisponível. Depende de API, parceria ou importação autorizada.',
  },
  {
    id: 'abcca',
    name: 'ABCCA',
    breed: 'arabe',
    available: false,
    reason: 'Integração indisponível. Depende de API, parceria ou importação autorizada.',
  },
] as const;

const paginationFields = {
  cursor: z.string().min(1).max(16384).optional(),
  limit: z.number().int().min(1).max(50).optional(),
};
const paginationRequestSchema = z.object(paginationFields).strict();
const horseSearchRequestSchema = z
  .object({
    ...paginationFields,
    query: z.string().max(200).optional(),
    breed: breedSchema.optional(),
  })
  .strict();
const cursorSchema = z
  .object({
    version: z.literal(1),
    scope: z.string(),
    snapshot: z.string(),
    after: z.string().min(1),
  })
  .strict();

/**
 * This local cursor is opaque to callers, but intentionally not a security token.
 * A future server must issue its own bounded/signed cursor. It is bound to both
 * the complete query and the ordered result IDs, so it cannot paginate a global
 * collection and then filter or silently continue a different query.
 */
export function paginateById<T extends { id: string }>(
  items: readonly T[],
  request: PaginationRequest = {},
  scope: string,
): Page<T> {
  const parsedRequest = paginationRequestSchema.safeParse(request);
  if (!parsedRequest.success) {
    throw new HorseProviderError(
      'INVALID_REQUEST',
      'Paginação inválida. Use entre 1 e 50 itens por página.',
    );
  }
  const sorted = [...items].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  );
  const identifiers = sorted.map((item) => item.id);
  if (new Set(identifiers).size !== identifiers.length) {
    throw new HorseProviderError('INVALID_REQUEST', 'A coleção contém identidades duplicadas.');
  }
  const snapshot = JSON.stringify(identifiers);
  const { cursor, limit = 20 } = parsedRequest.data;
  let startIndex = 0;
  if (cursor) {
    try {
      const decoded = cursorSchema.parse(JSON.parse(decodeURIComponent(cursor)) as unknown);
      const foundIndex = sorted.findIndex((item) => item.id === decoded.after);
      if (decoded.scope !== scope || decoded.snapshot !== snapshot || foundIndex === -1) {
        throw new Error('Cursor does not belong to this filtered collection.');
      }
      startIndex = foundIndex + 1;
    } catch {
      throw new HorseProviderError(
        'INVALID_CURSOR',
        'A busca mudou ou o cursor é inválido. Reinicie a busca.',
      );
    }
  }
  const pageItems = sorted.slice(startIndex, startIndex + limit);
  const lastItem = pageItems.at(-1);
  const hasMore = startIndex + pageItems.length < sorted.length;
  const nextCursor =
    hasMore && lastItem
      ? encodeURIComponent(
          JSON.stringify({
            version: 1,
            scope,
            snapshot,
            after: lastItem.id,
          }),
        )
      : null;
  return { items: pageItems, nextCursor, total: sorted.length };
}

export interface MockHorseDataProviderOptions {
  enabled?: boolean;
  latencyMs?: number;
  horses?: readonly Horse[];
  ancestry?: readonly AncestryRecord[];
}

export class MockHorseDataProvider implements HorseDataProvider {
  readonly source = 'equestre-demo';
  readonly capabilities: Readonly<HorseProviderCapabilities> = Object.freeze({
    search: true,
    getById: true,
    pedigree: true,
    offspring: true,
  });
  private readonly enabled: boolean;
  private readonly latencyMs: number;
  private readonly horses: readonly Horse[];
  private readonly ancestry: ReadonlyMap<string, AncestryRecord>;

  constructor(options: MockHorseDataProviderOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.latencyMs = options.latencyMs ?? 0;
    if (!Number.isFinite(this.latencyMs) || this.latencyMs < 0 || this.latencyMs > 30000) {
      throw new HorseProviderError(
        'INVALID_REQUEST',
        'A latência de demonstração deve estar entre 0 e 30000 ms.',
      );
    }
    this.horses = (options.horses ?? HORSES).map((horse) => horseSchema.parse(horse));
    if (this.horses.some((horse) => horse.externalSource !== this.source)) {
      throw new HorseProviderError(
        'INVALID_REQUEST',
        'O provider de demonstração aceita apenas a fonte fictícia.',
      );
    }
    if (new Set(this.horses.map((horse) => horse.id)).size !== this.horses.length) {
      throw new HorseProviderError('INVALID_REQUEST', 'O provider recebeu identidades duplicadas.');
    }
    const graph = new Map<string, AncestryRecord>();
    for (const record of options.ancestry ?? MOCK_ANCESTRY) {
      graph.set(record.horse.id, {
        horse: { ...record.horse },
        sire: record.sire ? { ...record.sire } : null,
        dam: record.dam ? { ...record.dam } : null,
      });
    }
    for (const horse of this.horses) {
      graph.set(horse.id, { horse: this.toReference(horse), sire: horse.sire, dam: horse.dam });
    }
    this.ancestry = graph;
  }

  async search(
    request: HorseSearchRequest = {},
    context: ProviderContext = {},
  ): Promise<Page<Horse>> {
    await this.ready(context);
    const parsed = horseSearchRequestSchema.safeParse(request);
    if (!parsed.success) {
      throw new HorseProviderError('INVALID_REQUEST', 'Revise os filtros e a paginação da busca.');
    }
    const filters = parsed.data;
    const normalizedQuery = normalizeSearchText(filters.query ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .join(' ');
    const scope = JSON.stringify({
      source: this.source,
      operation: 'search',
      query: normalizedQuery,
      breed: filters.breed ?? null,
    });
    const matches = filterHorses(this.horses, filters).map((horse) => horseSchema.parse(horse));
    return paginateById(matches, { cursor: filters.cursor, limit: filters.limit }, scope);
  }

  async getById(id: string, context: ProviderContext = {}): Promise<Horse> {
    await this.ready(context);
    return horseSchema.parse(this.requireHorse(id));
  }

  async getPedigree(id: string, context: ProviderContext = {}): Promise<HorsePedigree> {
    await this.ready(context);
    const horse = this.requireHorse(id);
    return {
      horseId: id,
      maxGenerations: 3,
      root: this.buildPedigree(this.toReference(horse), 0, new Set()),
      provenance: { ...DEMO_PROVENANCE },
    };
  }

  async getOffspring(
    id: string,
    request: PaginationRequest = {},
    context: ProviderContext = {},
  ): Promise<Page<Horse>> {
    await this.ready(context);
    this.requireHorse(id);
    const offspring = this.horses
      .filter((horse) => horse.sire?.id === id || horse.dam?.id === id)
      .map((horse) => horseSchema.parse(horse));
    return paginateById(
      offspring,
      request,
      JSON.stringify({ source: this.source, operation: 'offspring', parentId: id }),
    );
  }

  private requireHorse(id: string): Horse {
    const horse = this.horses.find((item) => item.id === id);
    if (!horse)
      throw new HorseProviderError(
        'NOT_FOUND',
        'Animal não encontrado nesta fonte de demonstração.',
      );
    return horse;
  }

  private toReference(horse: Horse): HorseReference {
    return { id: horse.id, name: horse.name, registryNumber: horse.registryNumber };
  }

  private buildPedigree(
    reference: HorseReference | null,
    generation: PedigreeGeneration,
    visited: ReadonlySet<string>,
  ): PedigreeNode {
    if (!reference || visited.has(reference.id)) return { horse: null, generation };
    const node: PedigreeNode = { horse: { ...reference }, generation };
    if (generation === 3) return node;
    const record = this.ancestry.get(reference.id);
    const nextVisited = new Set([...visited, reference.id]);
    const nextGeneration = (generation + 1) as PedigreeGeneration;
    node.sire = this.buildPedigree(record?.sire ?? null, nextGeneration, nextVisited);
    node.dam = this.buildPedigree(record?.dam ?? null, nextGeneration, nextVisited);
    return node;
  }

  private async ready(context: ProviderContext): Promise<void> {
    const { signal } = context;
    this.assertNotAborted(signal);
    if (!this.enabled) {
      throw new HorseProviderError(
        'PROVIDER_UNAVAILABLE',
        'A fonte de demonstração está indisponível. Tente novamente.',
      );
    }
    if (this.latencyMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          clearTimeout(timer);
          signal?.removeEventListener('abort', onAbort);
          reject(new HorseProviderError('ABORTED', 'Consulta cancelada.'));
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        }, this.latencyMs);
        signal?.addEventListener('abort', onAbort, { once: true });
        if (signal?.aborted) onAbort();
      });
    } else {
      await Promise.resolve();
    }
    this.assertNotAborted(signal);
  }

  private assertNotAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) throw new HorseProviderError('ABORTED', 'Consulta cancelada.');
  }
}
