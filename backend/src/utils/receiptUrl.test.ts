import test from 'node:test';
import assert from 'node:assert/strict';
import { isAcceptedReceiptUrl, isDriveReceiptUrl } from './receiptUrl';

test('accepts generated public Drive receipt URLs', () => {
  assert.equal(isDriveReceiptUrl('https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQr'), true);
  assert.equal(isAcceptedReceiptUrl('https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQr'), true);
});

test('keeps legacy local receipts readable without allowing arbitrary external URLs', () => {
  assert.equal(isAcceptedReceiptUrl('/uploads/public/documents/legacy-receipt.pdf'), true);
  assert.equal(isAcceptedReceiptUrl('https://example.com/receipt.pdf'), false);
  assert.equal(isAcceptedReceiptUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/view'), false);
});
