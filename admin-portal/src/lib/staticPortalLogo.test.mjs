import test from 'node:test';
import assert from 'node:assert/strict';
import { getStaticPortalLogo } from './staticPortalLogo.mjs';

test('maps portal branding locations to their fixed assets', () => {
  assert.equal(getStaticPortalLogo('header'), '/branding/adminportallogo.png');
  assert.equal(getStaticPortalLogo('login'), '/branding/loginadminlogo.png');
  assert.equal(getStaticPortalLogo('footer'), '/branding/adminportallogo.png');
});
