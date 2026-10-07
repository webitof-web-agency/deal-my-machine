import { formatPartnerTypeLabel } from '@/lib/partnerType';

const PARTNER_PORTAL_ORIGIN =
  process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || 'http://localhost:3001';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const PORTAL_ROLES = ['PARTNER', 'SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'];

const PORTAL_PROFILE_PATHS: Record<string, string> = {
  PARTNER: '/partner/profile',
  SUPER_ADMIN: '/superadmin/profile',
  ADMIN: '/admin/profile',
  EMPLOYEE: '/employee/profile',
};

const PORTAL_ROUTE_PREFIXES: Record<string, string> = {
  PARTNER: '/partner',
  SUPER_ADMIN: '/superadmin',
  ADMIN: '/admin',
  EMPLOYEE: '/employee',
};

export const getPortalProfilePath = (role?: string | null) =>
  (role && PORTAL_PROFILE_PATHS[role]) || '/profile';

const isRolePortalRoute = (role: string, pathname?: string | null) => {
  const prefix = PORTAL_ROUTE_PREFIXES[role];
  const normalizedPath = pathname?.trim();

  return Boolean(
    prefix &&
      normalizedPath &&
      normalizedPath.startsWith(`${prefix}/`) &&
      !normalizedPath.includes('://'),
  );
};

export const getPublicRoleLabel = ({
  role,
  partnerType,
  isPrimeCustomer,
}: {
  role?: string | null;
  partnerType?: string | null;
  isPrimeCustomer?: boolean;
}) => {
  switch (role) {
    case 'PARTNER':
      return formatPartnerTypeLabel(partnerType, 'Partner');
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'EMPLOYEE':
      return 'Employee';
    case 'CUSTOMER':
      return isPrimeCustomer ? 'Prime Customer' : '';
    default:
      return '';
  }
};

export const getPortalMenuLabel = (role?: string | null) =>
  role && PORTAL_ROLES.includes(role) ? 'My Portal' : 'My Profile';

export const getPortalTarget = ({
  role,
  token,
  fallbackPath,
}: {
  role?: string | null;
  token?: string | null;
  fallbackPath?: string | null;
}) => {
  if (role && PORTAL_ROLES.includes(role)) {
    const baseUrl = normalizeBaseUrl(PARTNER_PORTAL_ORIGIN);
    const loginUrl = new URL('/login', `${baseUrl}/`);
    const portalProfilePath = getPortalProfilePath(role);
    const safeNextRoute = fallbackPath && isRolePortalRoute(role, fallbackPath)
      ? fallbackPath
      : portalProfilePath;

    if (token) {
      loginUrl.searchParams.set('token', token);
    }

    loginUrl.searchParams.set('next', safeNextRoute);

    return loginUrl.toString();
  }

  return fallbackPath || '/profile';
};
