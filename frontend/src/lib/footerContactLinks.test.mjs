import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const footerPath = resolve(currentDir, '../components/layout/Footer.tsx');

test('footer contact items expose phone and configured map links', () => {
  const source = readFileSync(footerPath, 'utf8');

  assert.match(source, /googleMapsUrl/);
  assert.match(source, /const phoneHref =/);
  assert.match(source, /href=\{phoneHref \|\| undefined\}/);
  assert.match(source, /href=\{contact\.googleMapsUrl \|\| undefined\}/);
  assert.match(source, /mailto:\$\{contact\.emailAddress\}/);
});
