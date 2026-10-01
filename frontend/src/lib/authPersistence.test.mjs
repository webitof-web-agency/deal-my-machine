import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  getAuthStorageName,
  persistAuth,
} from './authPersistence.mjs';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

test('uses persistent storage only when Remember me is enabled', () => {
  assert.equal(getAuthStorageName(true), 'local');
  assert.equal(getAuthStorageName(false), 'session');
});

test('persists auth in the selected storage and clears the other storage', () => {
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const user = { id: 'user-1', email: 'user@example.com' };

  persistAuth(localStorage, sessionStorage, 'token-1', user, true);
  assert.equal(localStorage.getItem(AUTH_TOKEN_KEY), 'token-1');
  assert.equal(localStorage.getItem(AUTH_USER_KEY), JSON.stringify(user));
  assert.equal(sessionStorage.getItem(AUTH_TOKEN_KEY), null);

  persistAuth(localStorage, sessionStorage, 'token-2', user, false);
  assert.equal(sessionStorage.getItem(AUTH_TOKEN_KEY), 'token-2');
  assert.equal(sessionStorage.getItem(AUTH_USER_KEY), JSON.stringify(user));
  assert.equal(localStorage.getItem(AUTH_TOKEN_KEY), null);
});
