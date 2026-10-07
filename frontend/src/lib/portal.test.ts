import test from 'node:test';
import assert from 'node:assert/strict';
import { getPortalTarget } from './portal';

const expectedProfilePaths: Record<string, string> = {
  PARTNER: '/partner/profile',
  SUPER_ADMIN: '/superadmin/profile',
  ADMIN: '/admin/profile',
  EMPLOYEE: '/employee/profile',
};

test('routes every portal role to its own profile page during frontend SSO handoff', () => {
  for (const [role, expectedPath] of Object.entries(expectedProfilePaths)) {
    const target = new URL(getPortalTarget({
      role,
      token: 'test-token',
      // This is the legacy fallback that caused /profile 404s for portal users.
      fallbackPath: '/profile',
    }));

    assert.equal(target.searchParams.get('next'), expectedPath);
  }
});

test('keeps customers on the public profile route', () => {
  assert.equal(getPortalTarget({ role: 'CUSTOMER', fallbackPath: '/profile' }), '/profile');
});

test('does not pass a cross-role portal route through SSO', () => {
  const target = new URL(getPortalTarget({
    role: 'PARTNER',
    token: 'test-token',
    fallbackPath: '/superadmin/profile',
  }));

  assert.equal(target.searchParams.get('next'), '/partner/profile');
});
