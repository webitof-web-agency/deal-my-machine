/** Public brand configuration, supplied by the deployment environment. */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'JCB Exchange';
export const PORTAL_NAME = `${APP_NAME} Portal`;
