import test from 'node:test';
import assert from 'node:assert/strict';
import { getIdleTimeoutMs, getInitialActivityAt, getWarningAtMs, isIdleExpired } from './idleSession.mjs';

test('uses the configured idle timeout and warns one minute before expiry', () => {
  const timeout = getIdleTimeoutMs('15');
  assert.equal(timeout, 15 * 60 * 1000);
  assert.equal(getWarningAtMs(timeout), timeout - 60 * 1000);
});

test('detects inactivity using wall-clock time', () => {
  const timeout = getIdleTimeoutMs('15');
  assert.equal(isIdleExpired(0, timeout - 1, timeout), false);
  assert.equal(isIdleExpired(0, timeout, timeout), true);
});

test('starts a newly authenticated session from the current time', () => {
  const now = 1_700_000_000_000;
  assert.equal(getInitialActivityAt(now), now);
});
