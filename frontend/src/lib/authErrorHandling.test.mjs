import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldResetAuthSession } from './authErrorHandling.mjs';

const authenticatedError = (status, code) => ({
  config: { headers: { Authorization: 'Bearer stale-token' } },
  response: { status, data: { code } },
});

test('resets an authenticated session when the backend revokes the account', () => {
  assert.equal(
    shouldResetAuthSession(authenticatedError(403, 'ACCOUNT_REVOKED')),
    true,
  );
});

test('resets an authenticated session when the account is inactive', () => {
  assert.equal(
    shouldResetAuthSession(authenticatedError(403, 'ACCOUNT_INACTIVE')),
    true,
  );
});

test('does not clear a valid session for an unrelated forbidden response', () => {
  assert.equal(
    shouldResetAuthSession(authenticatedError(403, 'PERMISSION_DENIED')),
    false,
  );
});
