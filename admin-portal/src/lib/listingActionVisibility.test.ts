import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeleteListing, normalizePortalRole } from './listingActionVisibility';

test('normalizes common super admin role formats from persisted portal sessions', () => {
  assert.equal(normalizePortalRole('super admin'), 'SUPER_ADMIN');
  assert.equal(normalizePortalRole('SUPERADMIN'), 'SUPER_ADMIN');
});

test('allows a super admin to delete a listing owned by a super admin', () => {
  assert.equal(
    canDeleteListing({ viewerRole: 'SUPER_ADMIN', ownerRole: 'SUPER_ADMIN', hasDeletePermission: true }),
    true,
  );
});

test('keeps super admin-owned listings protected from non-super-admin users', () => {
  assert.equal(
    canDeleteListing({ viewerRole: 'ADMIN', ownerRole: 'SUPER_ADMIN', hasDeletePermission: true }),
    false,
  );
  assert.equal(
    canDeleteListing({ viewerRole: 'EMPLOYEE', ownerRole: 'SUPER_ADMIN', hasDeletePermission: true }),
    false,
  );
});
