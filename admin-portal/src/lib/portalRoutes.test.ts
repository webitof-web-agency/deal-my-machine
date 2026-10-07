import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePortalNextRoute } from './portalRoutes';

test('accepts each role profile route as a safe portal handoff destination', () => {
  assert.equal(resolvePortalNextRoute('SUPER_ADMIN', '/superadmin/profile'), '/superadmin/profile');
  assert.equal(resolvePortalNextRoute('ADMIN', '/admin/profile'), '/admin/profile');
  assert.equal(resolvePortalNextRoute('EMPLOYEE', '/employee/profile'), '/employee/profile');
  assert.equal(resolvePortalNextRoute('PARTNER', '/partner/profile'), '/partner/profile');
});

test('rejects the public profile route and cross-role portal routes', () => {
  assert.equal(resolvePortalNextRoute('SUPER_ADMIN', '/profile'), null);
  assert.equal(resolvePortalNextRoute('PARTNER', '/superadmin/profile'), null);
  assert.equal(resolvePortalNextRoute('EMPLOYEE', 'https://example.com/phishing'), null);
});
