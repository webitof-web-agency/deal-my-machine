import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePartnerRegistrationEnabled } from './publicAccessSettings';

test('keeps partner registration enabled by default for backward compatibility', () => {
  assert.equal(normalizePartnerRegistrationEnabled(undefined), true);
  assert.equal(normalizePartnerRegistrationEnabled(null), true);
});

test('disables partner registration only when the stored value is explicitly false', () => {
  assert.equal(normalizePartnerRegistrationEnabled(false), false);
  assert.equal(normalizePartnerRegistrationEnabled(true), true);
  assert.equal(normalizePartnerRegistrationEnabled('false'), true);
});
