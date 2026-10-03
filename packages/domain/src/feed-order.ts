/** Keep the reader's position while signals change; fresh listings append until a refresh. */
export function preserveListingOrder<T extends { id: string }>(
  ids: readonly string[],
  current: readonly T[],
): T[] {
  const remaining = new Map(current.map((item) => [item.id, item]));
  const ordered: T[] = [];
  for (const id of ids) {
    const item = remaining.get(id);
    if (item) {
      ordered.push(item);
      remaining.delete(id);
    }
  }
  return [...ordered, ...remaining.values()];
}
