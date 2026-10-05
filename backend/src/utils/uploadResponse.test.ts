import test from 'node:test';
import assert from 'node:assert/strict';
import { getAbsoluteUploadUrl } from './uploadResponse.js';

test('resolves local public uploads against the backend origin', () => {
  assert.equal(
    getAbsoluteUploadUrl({ protocol: 'http', host: 'localhost:5002' }, '/uploads/public/happy-customers/image.webp'),
    'http://localhost:5002/uploads/public/happy-customers/image.webp',
  );
});

test('keeps Google Drive upload URLs unchanged', () => {
  const driveUrl = 'https://drive.google.com/uc?id=drive-file-id';

  assert.equal(getAbsoluteUploadUrl({ protocol: 'https', host: 'example.com' }, driveUrl), driveUrl);
});
