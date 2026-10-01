import test from 'node:test';
import assert from 'node:assert/strict';
import { getFeaturedListingMediaQuery } from './publicListingQuery';

test('loads only the first featured image while preserving media count separately', () => {
  assert.deepEqual(getFeaturedListingMediaQuery(), {
    where: { type: 'IMAGE' },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'asc' },
    ],
    take: 1,
    select: {
      url: true,
      type: true,
      isFeatured: true,
      createdAt: true,
    },
  });
});
