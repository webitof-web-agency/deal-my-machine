import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBillingLocation } from './billingLocation';

test('requires both billing state and city before payment', () => {
  assert.deepEqual(normalizeBillingLocation({ state: '', city: '' }), {
    ok: false,
    error: 'Billing state and city are required before payment.',
  });
});

test('trims and returns the selected billing state and city', () => {
  assert.deepEqual(normalizeBillingLocation({ state: ' Maharashtra ', city: ' Mumbai ' }), {
    ok: true,
    value: { state: 'Maharashtra', city: 'Mumbai' },
  });
});
