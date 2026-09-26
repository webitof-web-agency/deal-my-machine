import test from 'node:test';
import assert from 'node:assert/strict';
import { SELF_PURCHASE_NOT_ALLOWED_CODE, isSelfPurchase } from './selfPurchase';

test('detects self-purchase using stable user IDs', () => {
  assert.equal(isSelfPurchase('user-1', 'user-1'), true);
  assert.equal(isSelfPurchase('user-1', 'user-2'), false);
  assert.equal(SELF_PURCHASE_NOT_ALLOWED_CODE, 'SELF_PURCHASE_NOT_ALLOWED');
});
