import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCustomerPrimeFeatureGateEnabled,
  normalizeCustomerPrimeSettings,
} from './customerPrime';

test('disables the Sell Vehicle Prime gate when its setting is off', () => {
  const settings = normalizeCustomerPrimeSettings({
    enabled: true,
    requireForSellListing: false,
  });

  assert.equal(
    isCustomerPrimeFeatureGateEnabled({
      settings,
      role: 'CUSTOMER',
      feature: 'SELL_LISTING',
    }),
    false,
  );
});

test('keeps the existing Sell Vehicle Prime gate when both switches are on', () => {
  const settings = normalizeCustomerPrimeSettings({
    enabled: true,
    requireForSellListing: true,
  });

  assert.equal(
    isCustomerPrimeFeatureGateEnabled({
      settings,
      role: 'CUSTOMER',
      feature: 'SELL_LISTING',
    }),
    true,
  );
});

test('does not gate Sell Vehicle for non-customer roles', () => {
  const settings = normalizeCustomerPrimeSettings({
    enabled: true,
    requireForSellListing: true,
  });

  assert.equal(
    isCustomerPrimeFeatureGateEnabled({
      settings,
      role: 'PARTNER',
      feature: 'SELL_LISTING',
    }),
    false,
  );
});
