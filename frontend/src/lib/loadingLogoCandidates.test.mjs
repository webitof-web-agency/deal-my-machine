import test from 'node:test';
import assert from 'node:assert/strict';
import { getLoadingLogoCandidates } from './loadingLogoCandidates.mjs';

test('starts loading with the local static logo before remote branding', () => {
  assert.deepEqual(
    getLoadingLogoCandidates({
      staticLogoUrl: '/branding/loadinglogo.png',
      initialLogoUrl: 'https://drive.example/custom.png',
      darkLogoUrl: 'https://drive.example/dark.png',
    }),
    ['/branding/loadinglogo.png', 'https://drive.example/custom.png', 'https://drive.example/dark.png'],
  );
});
