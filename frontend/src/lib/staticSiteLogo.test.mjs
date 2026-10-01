import test from 'node:test';
import assert from 'node:assert/strict';
import { getStaticSiteLogo } from './staticSiteLogo.mjs';

test('maps each public site brand location to its fixed asset', () => {
  assert.equal(getStaticSiteLogo('navbar'), '/branding/frontendlogo.png');
  assert.equal(getStaticSiteLogo('login'), '/branding/loginfrontlogo.png');
  assert.equal(getStaticSiteLogo('footer'), '/branding/logofooter.png');
});
