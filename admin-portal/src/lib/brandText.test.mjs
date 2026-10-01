import test from 'node:test';
import assert from 'node:assert/strict';
import { replaceLegacyPlatformBrand } from './brandText.mjs';

test('replaces legacy portal branding while preserving JCB machinery references', () => {
  assert.equal(
    replaceLegacyPlatformBrand('JCB Exchange admin tools for JCB 3DX Plus listings.', 'DealMyMachine'),
    'DealMyMachine admin tools for JCB 3DX Plus listings.',
  );
});

test('supports the legacy no-space platform spelling', () => {
  assert.equal(replaceLegacyPlatformBrand('JCBExchange portal', 'DealMyMachine'), 'DealMyMachine portal');
});

test('uses DealMyMachine when no replacement brand is provided', () => {
  assert.equal(replaceLegacyPlatformBrand('Welcome to JCB Exchange.'), 'Welcome to DealMyMachine.');
});
