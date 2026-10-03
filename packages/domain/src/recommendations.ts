import type { Breed, ListingCategory, ListingSummary } from './models';

export interface RecommendationPreferences {
  breeds: Breed[];
  categories: ListingCategory[];
  state?: string;
  maxPriceInCents?: number;
  personalized: boolean;
}

export interface RecommendationEvent {
  listingId: string;
  type: 'view' | 'favorite' | 'dismiss';
  at: string;
}

export type RecommendationListing = Pick<
  ListingSummary,
  | 'id'
  | 'title'
  | 'description'
  | 'category'
  | 'priceInCents'
  | 'location'
  | 'breed'
  | 'publishedAt'
  | 'seller'
>;

export interface RecommendationContext {
  preferences: RecommendationPreferences;
  events: readonly RecommendationEvent[];
  /** Supply the clock explicitly so a given profile and catalog always give the same result. */
  now: string | number | Date;
}

export interface RankedListing<T extends RecommendationListing> {
  listing: T;
  score: number;
  reason: string;
}

export const DEFAULT_RECOMMENDATION_PREFERENCES: RecommendationPreferences = {
  breeds: [],
  categories: [],
  personalized: true,
};

const DAY_MS = 86_400_000;
const HALF_LIFE_DAYS = 30;

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR');
}

function recencyFactor(at: number, now: number): number {
  return 2 ** (-Math.max(0, now - at) / DAY_MS / HALF_LIFE_DAYS);
}

function compareRecent<T extends RecommendationListing>(left: T, right: T): number {
  return (
    timestamp(right.publishedAt) - timestamp(left.publishedAt) ||
    left.id.localeCompare(right.id, 'pt-BR')
  );
}

function similarity(left: RecommendationListing, right: RecommendationListing): number {
  if (left.id === right.id) return 1;
  return (
    (left.category === right.category ? 0.4 : 0) +
    (left.breed && left.breed === right.breed ? 0.5 : 0) +
    (normalized(left.location.state) === normalized(right.location.state) ? 0.1 : 0)
  );
}

interface Signal {
  listing: RecommendationListing;
  type: 'view' | 'favorite';
  strength: number;
}

/**
 * Explicit favorites are current profile state: remove the favorite event when unfavoriting.
 * Repeated visits to one listing collapse into its latest signal, and favorites subsume visits.
 */
function collectSignals(
  listings: readonly RecommendationListing[],
  events: readonly RecommendationEvent[],
  dismissed: ReadonlySet<string>,
  now: number,
): Signal[] {
  const catalog = new Map(listings.map((listing) => [listing.id, listing]));
  const latest = new Map<string, { event: RecommendationEvent; at: number }>();
  for (const event of events) {
    if (event.type === 'dismiss' || dismissed.has(event.listingId)) continue;
    const at = Date.parse(event.at);
    if (!Number.isFinite(at) || at > now || !catalog.has(event.listingId)) continue;
    const previous = latest.get(event.listingId);
    if (
      !previous ||
      (event.type === 'favorite' && previous.event.type !== 'favorite') ||
      (event.type === previous.event.type && at > previous.at)
    ) {
      latest.set(event.listingId, { event, at });
    }
  }
  // Sorting keeps floating-point summation deterministic even if events arrive out of order.
  return [...latest.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'pt-BR'))
    .map(([listingId, { event, at }]) => ({
      listing: catalog.get(listingId)!,
      type: event.type as Signal['type'],
      strength: (event.type === 'favorite' ? 12 : 2) * recencyFactor(at, now),
    }));
}

function dataQuality(listing: RecommendationListing): number {
  return (
    (listing.title.trim().length >= 5 ? 0.5 : 0) +
    (listing.description.trim().length >= 30 ? 0.5 : 0) +
    (listing.location.city.trim() && listing.location.state.trim() ? 0.5 : 0) +
    (listing.seller.trim() ? 0.5 : 0)
  );
}

function scoreListing<T extends RecommendationListing>(
  listing: T,
  preferences: RecommendationPreferences,
  signals: readonly Signal[],
  now: number,
): RankedListing<T> {
  let score = 8 * recencyFactor(timestamp(listing.publishedAt), now) + dataQuality(listing);
  let reason = 'Novidade no marketplace';
  let reasonWeight = 0;
  const addPreference = (weight: number, explanation: string) => {
    score += weight;
    if (weight > reasonWeight) {
      reasonWeight = weight;
      reason = explanation;
    }
  };

  if (listing.breed && preferences.breeds.includes(listing.breed)) {
    addPreference(48, 'Raça que você escolheu');
  }
  if (preferences.categories.includes(listing.category)) {
    addPreference(36, 'Categoria que você escolheu');
  }
  if (
    preferences.state?.trim() &&
    normalized(preferences.state) === normalized(listing.location.state)
  ) {
    addPreference(24, 'No estado que você escolheu');
  }
  if (
    preferences.maxPriceInCents !== undefined &&
    Number.isFinite(preferences.maxPriceInCents) &&
    preferences.maxPriceInCents >= 0 &&
    listing.priceInCents !== null
  ) {
    if (listing.priceInCents <= preferences.maxPriceInCents) {
      addPreference(18, 'Dentro do seu orçamento');
    } else {
      score -= 36;
    }
  }

  let implicit = 0;
  let strongestSignal = 0;
  let implicitReason = '';
  for (const signal of signals) {
    const weight = similarity(listing, signal.listing) * signal.strength;
    implicit += weight;
    if (weight > strongestSignal) {
      strongestSignal = weight;
      implicitReason =
        signal.type === 'favorite'
          ? 'Com base nos seus favoritos'
          : 'Com base nos anúncios que você visitou';
    }
  }
  // Behavior can never outweigh a selected breed/category, regardless of event volume.
  score += Math.min(18, implicit);
  if (reasonWeight === 0 && strongestSignal >= 0.5) reason = implicitReason;
  return { listing, score, reason };
}

function repetitionPenalty(
  listing: RecommendationListing,
  recent: readonly RecommendationListing[],
): number {
  // A small, bounded penalty introduces variety among similarly relevant listings.
  return Math.min(
    4,
    recent.reduce(
      (penalty, previous) =>
        penalty +
        (previous.category === listing.category ? 0.5 : 0) +
        (listing.breed && previous.breed === listing.breed ? 0.5 : 0) +
        (normalized(previous.seller) === normalized(listing.seller) ? 1 : 0),
      0,
    ),
  );
}

/**
 * Transparent local rules, not a trained model. Pass only this customer's events.
 * Rank the complete available catalog before applying UI filters so prior interactions
 * retain their meaning. Price ordering and other explicit sorts belong to the caller.
 * A dismissal is an explicit exclusion even when personalization is switched off.
 */
export function rankListings<T extends RecommendationListing>(
  listings: readonly T[],
  { preferences, events, now: nowValue }: RecommendationContext,
): RankedListing<T>[] {
  const now =
    nowValue instanceof Date
      ? nowValue.getTime()
      : typeof nowValue === 'number'
        ? nowValue
        : Date.parse(nowValue);
  if (!Number.isFinite(now)) throw new Error('Informe uma data válida para as recomendações.');

  const dismissed = new Set(
    events.filter((event) => event.type === 'dismiss').map((event) => event.listingId),
  );
  const available = listings.filter((listing) => !dismissed.has(listing.id));
  if (!preferences.personalized) {
    return [...available].sort(compareRecent).map((listing) => ({
      listing,
      score: timestamp(listing.publishedAt),
      reason: 'Sem personalização · mais recentes primeiro',
    }));
  }

  const signals = collectSignals(listings, events, dismissed, now);
  const remaining = available.map((listing) => scoreListing(listing, preferences, signals, now));
  const ranked: RankedListing<T>[] = [];
  while (remaining.length) {
    const recent = ranked.slice(-3).map((item) => item.listing);
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index]!;
      const adjusted = candidate.score - repetitionPenalty(candidate.listing, recent);
      if (
        adjusted > bestScore ||
        (adjusted === bestScore &&
          compareRecent(candidate.listing, remaining[bestIndex]!.listing) < 0)
      ) {
        bestIndex = index;
        bestScore = adjusted;
      }
    }
    const [chosen] = remaining.splice(bestIndex, 1);
    ranked.push({ ...chosen!, score: bestScore });
  }
  return ranked;
}
