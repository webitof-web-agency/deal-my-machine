import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertDriveReceiptUpload,
  extractDriveFileId,
  getFolderNames,
  parseDriveRange,
  toDrivePublicUrl,
} from './googleDrive.service';

test('organizes Drive media by year and month in India time', () => {
  const names = getFolderNames(new Date('2026-03-31T19:00:00.000Z'));
  assert.deepEqual(names, { year: '2026', month: '04-April' });
});

test('extracts only supported Google Drive IDs and leaves external URLs alone', () => {
  assert.equal(extractDriveFileId('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/view'), '1AbCdEfGhIjKlMnOpQr');
  assert.equal(extractDriveFileId('https://images.unsplash.com/photo-123'), null);
});

test('parses open-ended and suffix byte ranges without exceeding the file', () => {
  assert.deepEqual(parseDriveRange('bytes=100-', 1000), { start: 100, end: 999 });
  assert.deepEqual(parseDriveRange('bytes=-100', 1000), { start: 900, end: 999 });
  assert.deepEqual(parseDriveRange('bytes=950-1200', 1000), { start: 950, end: 999 });
  assert.throws(() => parseDriveRange('bytes=1000-', 1000), (error: any) => error.statusCode === 416);
});

test('returns an owned proxy only when explicitly requested', () => {
  const fileId = '1AbCdEfGhIjKlMnOpQr';
  assert.equal(toDrivePublicUrl(fileId, false), `https://drive.google.com/uc?id=${fileId}`);
  assert.equal(toDrivePublicUrl(fileId, true), `/api/documents/upload/public/listing-media/drive/${fileId}`);
});

test('rejects receipt uploads when Drive did not return a remote file', () => {
  assert.throws(
    () => assertDriveReceiptUpload(null),
    (error: any) => error.code === 'DRIVE_STORAGE_UNAVAILABLE' && error.statusCode === 503,
  );
});

test('accepts only a Drive-backed receipt upload result', () => {
  const upload = { fileId: '1AbCdEfGhIjKlMnOpQr', viewLink: 'https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQr' };
  assert.deepEqual(assertDriveReceiptUpload(upload), upload);
});
