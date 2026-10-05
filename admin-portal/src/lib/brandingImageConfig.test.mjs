import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const nextConfigSource = await readFile(new URL('../../next.config.ts', import.meta.url), 'utf8');

test('allows uncached portal branding images through Next Image', () => {
  assert.match(nextConfigSource, /localPatterns\s*:/);
  assert.match(nextConfigSource, /pathname:\s*['"]\/branding\/\*\*['"]/);
  assert.match(nextConfigSource, /search:\s*['"]['"]|search:\s*['"]['"]?/);
  assert.match(nextConfigSource, /source:\s*['"]\/branding\/\:path\*['"]/);
  assert.match(nextConfigSource, /Cache-Control/);
  assert.match(nextConfigSource, /no-store/);
});
