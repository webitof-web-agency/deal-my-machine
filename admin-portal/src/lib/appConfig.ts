/** Public brand configuration, supplied by the deployment environment. */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'DealMyMachine';
export const PORTAL_NAME = `${APP_NAME} Portal`;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://dealmymachine.com';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'hello@dealmymachine.com';
export const ADMIN_EMAIL_FALLBACK = 'admin@dealmymachine.com';
export const PARTNER_EMAIL_FALLBACK = 'partner@dealmymachine.com';
export const MACHINE_BRAND_NAME = 'JCB';
