const toSlug = (value: string): string => String(value || 'app')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'app';

export const formatApiHealthMessage = (appName: string): string => `${appName} API is running`;

export const formatAnalyticsExportFilename = (appName: string, exportDate: string): string =>
  `${toSlug(appName)}-analytics-listings-${exportDate}.csv`;
