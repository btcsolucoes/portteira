import {
  BREEDS,
  type Breed,
  type EventSummary,
  type Horse,
  type ListingCategory,
  type ListingSummary,
} from './models';

export interface SearchFilters {
  query?: string | undefined;
  breed?: Breed | undefined;
}

export interface ListingFilters extends SearchFilters {
  category?: ListingCategory | undefined;
}

/** Accent and case folding is shared by every in-memory discovery surface. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function matchesQuery(query: string | undefined, fields: (string | undefined)[]): boolean {
  const tokens = normalizeSearchText(query ?? '')
    .split(/\s+/)
    .filter(Boolean);
  const searchable = normalizeSearchText(fields.filter(Boolean).join(' '));
  return tokens.every((token) => searchable.includes(token));
}

function breedLabel(breed: Breed): string {
  return BREEDS.find((item) => item.id === breed)?.label ?? breed;
}

export function filterEvents(
  events: readonly EventSummary[],
  filters: SearchFilters = {},
): EventSummary[] {
  return events.filter(
    (event) =>
      (!filters.breed || event.breeds.includes(filters.breed)) &&
      matchesQuery(filters.query, [
        event.title,
        event.description,
        event.location.city,
        event.location.state,
        event.venue,
        event.modality,
        ...event.breeds.map(breedLabel),
      ]),
  );
}

export function filterListings<
  T extends Pick<
    ListingSummary,
    'title' | 'description' | 'category' | 'breed' | 'location' | 'seller'
  >,
>(listings: readonly T[], filters: ListingFilters = {}): T[] {
  return listings.filter(
    (listing) =>
      (!filters.breed || listing.breed === filters.breed) &&
      (!filters.category || listing.category === filters.category) &&
      matchesQuery(filters.query, [
        listing.title,
        listing.description,
        listing.location.city,
        listing.location.state,
        listing.seller,
        listing.breed ? breedLabel(listing.breed) : undefined,
      ]),
  );
}

export function filterHorses(horses: readonly Horse[], filters: SearchFilters = {}): Horse[] {
  return horses.filter(
    (horse) =>
      (!filters.breed || horse.breed === filters.breed) &&
      matchesQuery(filters.query, [
        horse.name,
        horse.registryNumber,
        horse.location.city,
        horse.location.state,
        horse.breeder,
        horse.owner,
        horse.lineage,
        breedLabel(horse.breed),
      ]),
  );
}
