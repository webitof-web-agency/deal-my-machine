import test from 'node:test';
import assert from 'node:assert/strict';
import { replaceLegacyPlatformBrand } from './brandText.mjs';

test('replaces legacy platform branding without changing JCB machinery references', () => {
  assert.equal(
    replaceLegacyPlatformBrand('JCB Exchange helps buyers find JCB 3DX Plus machines.', 'DealMyMachine'),
    'DealMyMachine helps buyers find JCB 3DX Plus machines.',
  );
});

test('supports the legacy no-space platform spelling', () => {
  assert.equal(replaceLegacyPlatformBrand('I found you on JCBExchange.', 'DealMyMachine'), 'I found you on DealMyMachine.');
});

test('uses DealMyMachine when no replacement brand is provided', () => {
  assert.equal(replaceLegacyPlatformBrand('Welcome to JCB Exchange.'), 'Welcome to DealMyMachine.');
});
