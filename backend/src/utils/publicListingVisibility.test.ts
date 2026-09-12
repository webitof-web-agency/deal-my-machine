import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMarketplaceSellerPresentation,
  getPublicSellerWhere,
  getSellerDisplayName,
  isPublicMarketplaceListingVisible,
} from './publicListingVisibility';

test('allows active super admin and employee listings without partner KYC', () => {
  const sellerWhere = getPublicSellerWhere() as { OR: Array<Record<string, unknown>> };

  assert.ok(
    sellerWhere.OR.some((condition) =>
      JSON.stringify(condition).includes('SUPER_ADMIN'),
    ),
  );

  assert.equal(
    isPublicMarketplaceListingVisible({
      status: 'PUBLISHED',
      partner: { role: 'SUPER_ADMIN', status: 'ACTIVE', partnerProfile: null },
    }),
    true,
  );
  assert.equal(
    isPublicMarketplaceListingVisible({
      status: 'PUBLISHED',
      partner: { role: 'EMPLOYEE', status: 'ACTIVE', partnerProfile: null },
    }),
    true,
  );
});

test('keeps inactive or unpublished staff listings out of the public marketplace', () => {
  assert.equal(
    isPublicMarketplaceListingVisible({
      status: 'PUBLISHED',
      partner: { role: 'EMPLOYEE', status: 'INACTIVE', partnerProfile: null },
    }),
    false,
  );
  assert.equal(
    isPublicMarketplaceListingVisible({
      status: 'PENDING_APPROVAL',
      partner: { role: 'SUPER_ADMIN', status: 'ACTIVE', partnerProfile: null },
    }),
    false,
  );
});

test('uses the creator name and email fallback for staff seller presentation', () => {
  assert.equal(
    getMarketplaceSellerPresentation({
      role: 'SUPER_ADMIN',
      name: 'meghrajsuper',
      email: 'meghrajsuper@example.com',
    }).displayName,
    'meghrajsuper',
  );
  const employeePresentation = getMarketplaceSellerPresentation({
      role: 'EMPLOYEE',
      name: null,
      email: 'employee@example.com',
    });
  assert.equal(employeePresentation.displayName, 'employee');
  assert.equal(employeePresentation.partnerType, 'Employee');
  assert.equal(
    getSellerDisplayName({ role: 'SUPER_ADMIN', name: null, email: null }),
    'Super Admin',
  );
});
