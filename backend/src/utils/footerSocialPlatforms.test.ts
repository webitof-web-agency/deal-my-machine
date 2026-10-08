import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOOTER_SOCIAL_PLATFORMS,
  dedupeFooterSocialPlatforms,
} from './footerSocialPlatforms';

test('supports the configured major footer social platforms without Google or custom entries', () => {
  assert.equal(FOOTER_SOCIAL_PLATFORMS.length, 15);
  assert.deepEqual(
    FOOTER_SOCIAL_PLATFORMS.map((platform) => platform.id),
    [
      'FACEBOOK',
      'INSTAGRAM',
      'TWITTER',
      'LINKEDIN',
      'YOUTUBE',
      'WHATSAPP',
      'TELEGRAM',
      'TIKTOK',
      'SNAPCHAT',
      'PINTEREST',
      'REDDIT',
      'DISCORD',
      'GITHUB',
      'THREADS',
      'VK',
    ],
  );
});

test('keeps the first configured entry for each platform and drops unsupported duplicates', () => {
  const normalized = dedupeFooterSocialPlatforms([
    { platform: 'FACEBOOK', url: 'https://facebook.com/first' },
    { platform: 'FACEBOOK', url: 'https://facebook.com/duplicate' },
    { platform: 'YOUTUBE', url: 'https://youtube.com/channel/demo' },
    { platform: 'GOOGLE_BUSINESS', url: 'https://maps.google.com/' },
  ]);

  assert.deepEqual(normalized.map((item) => item.platform), ['FACEBOOK', 'YOUTUBE']);
  assert.equal(normalized[0]?.url, 'https://facebook.com/first');
});
