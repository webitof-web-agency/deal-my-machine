import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '../..');

test('root layouts do not globally preload the loading logo', () => {
  const sourcePaths = [
    resolve(projectRoot, 'src/app/layout.tsx'),
    resolve(projectRoot, '../admin-portal/src/app/layout.tsx'),
    resolve(projectRoot, 'src/components/ui/BrandLoader.tsx'),
    resolve(projectRoot, '../admin-portal/src/components/ui/BrandLoader.tsx'),
  ];

  for (const sourcePath of sourcePaths) {
    const source = readFileSync(sourcePath, 'utf8');
    assert.doesNotMatch(source, /rel=["']preload["'][^>]*loadinglogo\.png/);
    assert.doesNotMatch(source, /src={STATIC_LOADING_LOGO}[\s\S]{0,300}\bpriority\b/);
  }
});
