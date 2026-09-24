export const normalizeApiBaseUrl = (value: string) => {
  const normalized = value.trim().replace(/\/+$/, '');

  if (!normalized) {
    throw new Error('NEXT_PUBLIC_API_URL is empty');
  }

  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
};
