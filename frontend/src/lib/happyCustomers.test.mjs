import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHappyCustomerMarqueeItems, getDisplayHappyCustomers } from './happyCustomers.mjs';

test('filters invalid happy customer cards and keeps order', () => {
  const items = getDisplayHappyCustomers([
    { id: '1', name: 'One', imageUrl: '/one.png', displayOrder: 1 },
    { id: 'invalid', name: 'Missing image', imageUrl: '', displayOrder: 2 },
    { id: '2', name: 'Two', imageUrl: '/two.png', displayOrder: 0 },
  ]);

  assert.deepEqual(items.map((item) => item.id), ['2', '1']);
});

test('keeps the marquee sequence at the same count as the configured cards', () => {
  const items = [{ id: '1', name: 'One', imageUrl: '/one.png', displayOrder: 0 }];

  assert.equal(buildHappyCustomerMarqueeItems(items).length, 1);
  assert.deepEqual(buildHappyCustomerMarqueeItems(items).map((item) => item.id), ['1']);
});
