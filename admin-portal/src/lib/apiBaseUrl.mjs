/**
 * Normalize the backend URL once so every admin-portal request targets the
 * same API prefix, whether deployment config contains the origin or /api.
 */
export function normalizeApiBaseUrl(value) {
  const normalized = String(value || '').trim().replace(/\/+$/, '');

  if (!normalized) {
    throw new Error('API base URL is empty');
  }

  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
}
