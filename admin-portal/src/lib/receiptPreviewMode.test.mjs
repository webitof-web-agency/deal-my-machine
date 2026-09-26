import test from 'node:test';
import assert from 'node:assert/strict';
import { getReceiptPreviewMode } from './receiptPreviewMode.mjs';

test('uses a fit-to-modal image preview for image receipts', () => {
  assert.equal(getReceiptPreviewMode('https://api.example.com/api/documents/receipt/drive/file-id'), 'image');
});

test('uses a document preview for PDF receipts and image fallback failures', () => {
  assert.equal(getReceiptPreviewMode('/uploads/public/documents/receipt.pdf'), 'document');
  assert.equal(getReceiptPreviewMode('receipt-preview', 'error'), 'document');
});
