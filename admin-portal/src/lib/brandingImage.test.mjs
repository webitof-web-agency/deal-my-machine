import test from 'node:test';
import assert from 'node:assert/strict';
import { isStaticBrandingAsset } from './brandingImage.mjs';

test('only local branding assets use Next image optimization', () => {
  assert.equal(isStaticBrandingAsset('/branding/adminportallogo.png'), true);
  assert.equal(isStaticBrandingAsset('https://api.example.com/uploads/logo.png'), false);
  assert.equal(isStaticBrandingAsset('/uploads/logo.png'), false);
});
