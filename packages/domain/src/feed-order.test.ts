import { describe, expect, it } from 'vitest';
import { preserveListingOrder } from './feed-order';

describe('reading order', () => {
  it('keeps the reading position when a view or favorite changes ranking', () => {
    const reranked = [{ id: 'c' }, { id: 'a' }, { id: 'b' }];
    expect(preserveListingOrder(['a', 'b', 'c'], reranked).map((item) => item.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(preserveListingOrder(['c', 'a', 'b'], reranked).map((item) => item.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
  it('removes unavailable listings and appends new ones without shifting existing ones', () => {
    expect(preserveListingOrder(['a', 'b'], [{ id: 'c' }, { id: 'b' }])).toEqual([
      { id: 'b' },
      { id: 'c' },
    ]);
  });
  it('restores a hidden listing to its original position with its latest data', () => {
    const ids = ['a', 'b', 'c'];
    expect(preserveListingOrder(ids, [{ id: 'c' }, { id: 'a' }]).map((item) => item.id)).toEqual([
      'a',
      'c',
    ]);
    expect(
      preserveListingOrder(ids, [{ id: 'b', title: 'Updated' }, { id: 'c' }, { id: 'a' }]),
    ).toEqual([{ id: 'a' }, { id: 'b', title: 'Updated' }, { id: 'c' }]);
  });
});
