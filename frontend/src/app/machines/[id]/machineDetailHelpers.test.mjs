import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthlyEmi, rankRelatedListings } from './machineDetailHelpers.mjs';

test('calculates a monthly EMI from the selected loan terms', () => {
  assert.equal(calculateMonthlyEmi(2000000, 10.5, 5), 42988);
});

test('calculates zero-interest EMI without producing invalid values', () => {
  assert.equal(calculateMonthlyEmi(120000, 0, 2), 5000);
});

test('ranks dynamic suggestions by category and brand without including the current or sold listing', () => {
  const current = { id: 'current', category: { id: 'excavator' }, brand: { id: 'jcb' } };
  const suggestions = [
    { id: 'brand-match', status: 'PUBLISHED', category: { id: 'loader' }, brand: { id: 'jcb' } },
    { id: 'category-match', status: 'PUBLISHED', category: { id: 'excavator' }, brand: { id: 'cat' } },
    { id: 'sold', status: 'SOLD', category: { id: 'excavator' }, brand: { id: 'jcb' } },
    { id: 'current', status: 'PUBLISHED', category: { id: 'excavator' }, brand: { id: 'jcb' } },
  ];

  assert.deepEqual(
    rankRelatedListings(suggestions, current).map((listing) => listing.id),
    ['category-match', 'brand-match'],
  );
});

test('falls back to other available listings when no category or brand match exists', () => {
  const current = { id: 'current', category: { id: 'excavator' }, brand: { id: 'jcb' } };
  const suggestions = [
    { id: 'other', status: 'PUBLISHED', category: { id: 'roller' }, brand: { id: 'cat' } },
  ];

  assert.deepEqual(rankRelatedListings(suggestions, current).map((listing) => listing.id), ['other']);
});
