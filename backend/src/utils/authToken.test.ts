import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthTokenPayload } from './authToken';

test('preserves the current database auth version in a newly issued token payload', () => {
  const payload = buildAuthTokenPayload({
    id: 'user-1',
    email: 'admin@example.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    authVersion: 4,
  });

  assert.equal(payload.authVersion, 4);
});
