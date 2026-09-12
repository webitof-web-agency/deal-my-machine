import dotenv from 'dotenv';

// Load local .env before any service reads the shared configuration.
dotenv.config();

/** Runtime application configuration shared by backend services. */
export const APP_NAME = process.env.APP_NAME?.trim() || 'JCB Exchange';
