import dotenv from 'dotenv';

// Load local .env before any service reads the shared configuration.
dotenv.config();

/** Runtime application configuration shared by backend services. */
export const APP_NAME = process.env.APP_NAME?.trim() || 'DealMyMachine';
export const SITE_URL = process.env.SITE_URL?.trim() || 'https://dealmymachine.com';
export const FRONTEND_URL = process.env.FRONTEND_URL?.trim() || SITE_URL;
export const ADMIN_PORTAL_URL = process.env.ADMIN_PORTAL_URL?.trim() || 'https://admin.dealmymachine.com';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL?.trim() || 'hello@dealmymachine.com';
export const ADMIN_EMAIL_FALLBACK = process.env.ADMIN_EMAIL_FALLBACK?.trim() || SUPPORT_EMAIL;
export const APPLICATION_REFERENCE_PREFIX =
  process.env.APPLICATION_REFERENCE_PREFIX?.trim() || 'DMM-JOB';

const configuredJwtSecret = process.env.JWT_SECRET?.trim();
if (!configuredJwtSecret) {
  throw new Error('JWT_SECRET is required. Set it in the backend environment before starting the API.');
}
export const JWT_SECRET = configuredJwtSecret;

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT?.trim() || `mailto:${ADMIN_EMAIL_FALLBACK}`;
export const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL?.trim() || '';

// These values keep existing Android notification grouping stable while making
// the behavior configurable for future clients.
export const PUSH_NOTIFICATION_GROUP =
  process.env.PUSH_NOTIFICATION_GROUP?.trim() || 'jcb_notification_group';
export const PUSH_NOTIFICATION_TAG =
  process.env.PUSH_NOTIFICATION_TAG?.trim() || 'jcb_notification';

export const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  SITE_URL,
  'https://www.dealmymachine.com',
  ADMIN_PORTAL_URL,
];
