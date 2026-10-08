import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOOTER_SOCIAL_PLATFORMS,
  getAvailableFooterSocialPlatforms,
} from './footerSocialPlatforms.mjs';

test('admin platform options include all supported brands and exclude Google/custom', () => {
  assert.equal(FOOTER_SOCIAL_PLATFORMS.length, 15);
  assert.equal(FOOTER_SOCIAL_PLATFORMS.some((item) => item.id === 'GOOGLE_BUSINESS'), false);
  assert.equal(FOOTER_SOCIAL_PLATFORMS.some((item) => item.id === 'CUSTOM'), false);
});

test('admin platform options prevent selecting a platform twice', () => {
  const available = getAvailableFooterSocialPlatforms(['FACEBOOK', 'YOUTUBE'], 'YOUTUBE');

  assert.equal(available.some((item) => item.id === 'FACEBOOK'), false);
  assert.equal(available.some((item) => item.id === 'YOUTUBE'), true);
  assert.equal(available.some((item) => item.id === 'INSTAGRAM'), true);
});
