import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleFeaturedListings } from './shuffleFeaturedListings';

test('shuffles listings without mutating the API response', () => {
  const listings = [
    { id: 'one' },
    { id: 'two' },
    { id: 'three' },
    { id: 'four' },
  ];

  const shuffled = shuffleFeaturedListings(listings, () => 0.75);

  assert.deepEqual(listings.map((listing) => listing.id), ['one', 'two', 'three', 'four']);
  assert.deepEqual(shuffled.map((listing) => listing.id), ['one', 'two', 'four', 'three']);
});
