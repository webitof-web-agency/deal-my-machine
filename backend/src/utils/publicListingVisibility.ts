const publicListingStatuses = ['PUBLISHED', 'RESERVED', 'PAUSED', 'SOLD'] as const;
const publicInternalSellerRoles = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] as const;

const formatRoleLabel = (role?: string | null) => {
  const normalizedRole = String(role || '').trim().toUpperCase();
  if (!normalizedRole) {
    return 'Marketplace Seller';
  }

  return normalizedRole
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const approvedPartnerProfileWhere = {
  onboardingStatus: 'APPROVED',
  accountStatus: 'ACTIVE',
  kycStatus: 'APPROVED',
} as const;

export const getPublicListingStatuses = () => [...publicListingStatuses];

export const getApprovedPartnerProfileWhere = () => ({ ...approvedPartnerProfileWhere });

export const getPublicSellerWhere = () => ({
  OR: [
    {
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    {
      role: { in: [...publicInternalSellerRoles] },
      status: 'ACTIVE',
    },
    {
      partnerProfile: getApprovedPartnerProfileWhere(),
    },
  ],
});

export const getSellerDisplayName = (seller?: {
  role?: string | null;
  name?: string | null;
  email?: string | null;
  partnerProfile?: {
    businessName?: string | null;
  } | null;
}) => {
  const businessName = seller?.partnerProfile?.businessName?.trim();
  if (businessName) {
    return businessName;
  }

  const name = seller?.name?.trim();
  if (name) {
    return name;
  }

  const emailLocalPart = seller?.email?.split('@')[0]?.trim();
  if (emailLocalPart) {
    return emailLocalPart;
  }

  if (seller?.role === 'SUPER_ADMIN') {
    return 'Super Admin';
  }

  if (seller?.role === 'ADMIN') {
    return 'Admin';
  }

  if (seller?.role === 'EMPLOYEE') {
    return 'Employee';
  }

  return 'Marketplace Seller';
};

export const getPublicMarketplaceListingWhere = () => ({
  status: {
    in: getPublicListingStatuses(),
  },
  partner: getPublicSellerWhere(),
});

export const isPublicMarketplaceListingVisible = (listing: {
  status?: string | null;
  partner?: {
    role?: string | null;
    status?: string | null;
    partnerProfile?: {
      onboardingStatus?: string | null;
      accountStatus?: string | null;
      kycStatus?: string | null;
    } | null;
  } | null;
}) => {
  const normalizedStatus = String(listing.status || '').toUpperCase();
  if (!publicListingStatuses.includes(normalizedStatus as (typeof publicListingStatuses)[number])) {
    return false;
  }

  if (listing.partner?.role === 'CUSTOMER' && listing.partner?.status === 'ACTIVE') {
    return true;
  }

  if (
    publicInternalSellerRoles.includes(listing.partner?.role as (typeof publicInternalSellerRoles)[number]) &&
    listing.partner?.status === 'ACTIVE'
  ) {
    return true;
  }

  return (
    listing.partner?.partnerProfile?.onboardingStatus === approvedPartnerProfileWhere.onboardingStatus &&
    listing.partner?.partnerProfile?.accountStatus === approvedPartnerProfileWhere.accountStatus &&
    listing.partner?.partnerProfile?.kycStatus === approvedPartnerProfileWhere.kycStatus
  );
};

export const getMarketplaceSellerPresentation = (seller?: {
  role?: string | null;
  name?: string | null;
  email?: string | null;
  customerPrimeSubscriptions?: Array<{
    expiresAt?: Date | null;
  }> | null;
  partnerProfile?: {
    businessName?: string | null;
    partnerType?: string | null;
  } | null;
}) => {
  const isPartnerSeller = seller?.role === 'PARTNER';
  const hasActivePrimeSubscription =
    seller?.role === 'CUSTOMER' &&
    !!seller.customerPrimeSubscriptions?.some((subscription) => {
      return !!subscription.expiresAt && subscription.expiresAt >= new Date();
    });

  return {
    displayName:
      getSellerDisplayName(seller) || (isPartnerSeller ? 'Verified Partner' : 'Marketplace Seller'),
    partnerType: isPartnerSeller
      ? seller?.partnerProfile?.partnerType || null
      : hasActivePrimeSubscription
        ? 'PRIME_CUSTOMER'
        : publicInternalSellerRoles.includes(seller?.role as (typeof publicInternalSellerRoles)[number])
          ? formatRoleLabel(seller?.role)
          : null,
  };
};
