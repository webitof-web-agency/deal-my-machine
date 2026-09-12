type ListingActionVisibilityInput = {
  viewerRole?: string | null;
  ownerRole?: string | null;
  hasDeletePermission: boolean;
};

export const normalizePortalRole = (role?: string | null): string => {
  const normalizedRole = String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return normalizedRole === 'SUPERADMIN' ? 'SUPER_ADMIN' : normalizedRole;
};

export const canDeleteListing = ({
  viewerRole,
  ownerRole,
  hasDeletePermission,
}: ListingActionVisibilityInput): boolean =>
  normalizePortalRole(viewerRole) === 'SUPER_ADMIN' ||
  (hasDeletePermission && normalizePortalRole(ownerRole) !== 'SUPER_ADMIN');
