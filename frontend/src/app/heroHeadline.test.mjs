import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroHeadlineLines, getHeroHeadlineAccentLineIndex } from './heroHeadline.mjs';

test('preserves admin-entered hero headline line breaks', () => {
  const lines = getHeroHeadlineLines('Find the right machine.\r\nBuild with confidence.');

  assert.deepEqual(lines, ['Find the right machine.', 'Build with confidence.']);
});

test('keeps intentional blank lines and accents the last non-empty line', () => {
  const lines = getHeroHeadlineLines('Find the right machine.\n\nBuild with confidence.');

  assert.deepEqual(lines, ['Find the right machine.', '', 'Build with confidence.']);
  assert.equal(getHeroHeadlineAccentLineIndex(lines), 2);
});
