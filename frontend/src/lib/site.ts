/** Public brand name, configured per deployment through NEXT_PUBLIC_APP_NAME. */
export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'JCB Exchange';
export const SITE_DESCRIPTION =
  "India's trusted marketplace for heavy machinery. Buy, sell and rent JCBs, excavators and more.";
export const SITE_URL = 'https://jcbexchange.com';
export const SITE_OG_IMAGE = `${SITE_URL}/og-default.svg`;
export const SITE_TWITTER_IMAGE = SITE_OG_IMAGE;
export const SITE_LOGO_URL = `${SITE_URL}/icon.svg`;
