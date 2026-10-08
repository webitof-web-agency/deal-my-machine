import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  FOOTER_SOCIAL_PLATFORMS,
  getVisibleFooterSocialLinks,
} from './footerSocialPlatforms.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const footerPath = resolve(currentDir, '../components/layout/Footer.tsx');

test('public footer exposes an icon definition for every supported platform', () => {
  assert.equal(FOOTER_SOCIAL_PLATFORMS.length, 15);
  assert.equal(FOOTER_SOCIAL_PLATFORMS.every((item) => item.icon), true);
});

test('public footer removes unsupported and duplicate social links before rendering', () => {
  const visible = getVisibleFooterSocialLinks([
    { id: '1', platform: 'FACEBOOK', url: 'https://facebook.com/first', displayOrder: 1 },
    { id: '2', platform: 'FACEBOOK', url: 'https://facebook.com/duplicate', displayOrder: 0 },
    { id: '3', platform: 'YOUTUBE', url: 'https://youtube.com/demo', displayOrder: 2 },
    { id: '4', platform: 'CUSTOM', url: 'https://example.com', displayOrder: 3 },
  ]);

  assert.deepEqual(visible.map((item) => item.platform), ['FACEBOOK', 'YOUTUBE']);
  assert.equal(visible[0]?.url, 'https://facebook.com/first');
});

test('public footer wraps social icons instead of overflowing when many platforms are configured', () => {
  const source = readFileSync(footerPath, 'utf8');

  assert.match(source, /className="flex flex-wrap items-center gap-3"/);
});
