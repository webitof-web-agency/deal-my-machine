import test from 'node:test';
import assert from 'node:assert/strict';
import { isAuthVersionCurrent } from './authVersion';

test('accepts a token when its auth version matches the database version', () => {
  assert.equal(isAuthVersionCurrent({ tokenVersion: 3, databaseVersion: 3 }), true);
});

test('rejects legacy or stale tokens after credentials are changed', () => {
  assert.equal(isAuthVersionCurrent({ tokenVersion: undefined, databaseVersion: 0 }), true);
  assert.equal(isAuthVersionCurrent({ tokenVersion: 2, databaseVersion: 3 }), false);
});
