import { describe, expect, it } from 'vitest';
import { unwrapList } from './api';

describe('unwrapList', () => {
  it('returns array as-is', () => {
    expect(unwrapList([1, 2])).toEqual([1, 2]);
  });

  it('unwraps paginated DRF shape', () => {
    expect(unwrapList({ count: 1, results: [{ id: 1 }] })).toEqual([{ id: 1 }]);
  });

  it('returns empty for invalid payload', () => {
    expect(unwrapList(null)).toEqual([]);
  });
});
