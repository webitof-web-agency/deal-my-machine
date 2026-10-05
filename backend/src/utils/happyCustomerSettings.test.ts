import test from 'node:test';
import assert from 'node:assert/strict';
import { getHappyCustomerDriveProxyUrl, normalizeHappyCustomerItems } from './happyCustomerSettings.js';

test('normalizes happy customer cards for public display', () => {
  const items = normalizeHappyCustomerItems([
    { id: ' second ', name: '  Customer Two ', imageUrl: ' /uploads/two.png ', displayOrder: 2 },
    { id: 'first', name: 'Customer One', imageUrl: '/uploads/one.png', displayOrder: 1 },
    { id: 'invalid', name: '', imageUrl: '/uploads/invalid.png', displayOrder: 0 },
  ]);

  assert.deepEqual(items.map(({ id, name, imageUrl, displayOrder }) => ({ id, name, imageUrl, displayOrder })), [
    { id: 'first', name: 'Customer One', imageUrl: '/uploads/one.png', displayOrder: 0 },
    { id: 'second', name: 'Customer Two', imageUrl: '/uploads/two.png', displayOrder: 1 },
  ]);
});

test('normalizes Google Drive image links to the public Drive proxy', () => {
  const [item] = normalizeHappyCustomerItems([
    {
      name: 'Drive Customer',
      imageUrl: 'https://drive.google.com/uc?id=1M-rnjeAx6E-AqdqHZ8k1l6QC1UyrZzdS',
    },
  ]);

  assert.ok(item);
  assert.equal(
    item.imageUrl,
    getHappyCustomerDriveProxyUrl('1M-rnjeAx6E-AqdqHZ8k1l6QC1UyrZzdS'),
  );
});
