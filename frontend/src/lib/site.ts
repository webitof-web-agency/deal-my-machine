/** Public brand identity, configured per deployment where appropriate. */
export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'DealMyMachine';
export const SITE_DESCRIPTION =
  "India's marketplace for new and used heavy machinery, construction equipment, trusted dealers, and verified listings.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://dealmymachine.com';
export const SITE_SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'hello@dealmymachine.com';
export const SITE_FALLBACK_EMAIL = 'customer@dealmymachine.com';
export const SITE_OG_IMAGE = `${SITE_URL}/og-default.svg`;
export const SITE_TWITTER_IMAGE = SITE_OG_IMAGE;
export const SITE_LOGO_URL = `${SITE_URL}/icon.svg`;
