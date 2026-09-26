import test from 'node:test';
import assert from 'node:assert/strict';
import { getReceiptDriveFileId, toReceiptProxyUrl } from './receiptPreview';

test('extracts a Drive file id from the generated receipt URL', () => {
  const url = 'https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQr';
  assert.equal(getReceiptDriveFileId(url), '1AbCdEfGhIjKlMnOpQr');
  assert.equal(toReceiptProxyUrl('1AbCdEfGhIjKlMnOpQr'), '/api/documents/receipt/drive/1AbCdEfGhIjKlMnOpQr');
});

test('does not proxy legacy local receipts or arbitrary URLs', () => {
  assert.equal(getReceiptDriveFileId('/uploads/public/documents/receipt.webp'), null);
  assert.equal(getReceiptDriveFileId('https://example.com/receipt.webp'), null);
});
