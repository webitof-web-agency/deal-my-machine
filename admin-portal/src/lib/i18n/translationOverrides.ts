import { type AppLocale } from '@/lib/i18n/config';
import { normalizeApiBaseUrl } from '@/lib/apiBaseUrl.mjs';

const resolveApiBaseUrl = () => {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!configuredApiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }

  return normalizeApiBaseUrl(configuredApiUrl);
};

export const fetchTranslationOverrides = async (
  app: 'frontend' | 'admin-portal',
  locale: AppLocale
): Promise<Record<string, string>> => {
  const url = `${resolveApiBaseUrl()}/master/translations?app=${encodeURIComponent(
    app
  )}&locale=${encodeURIComponent(locale)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept-Language': locale,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch translation overrides for ${app}:${locale}`);
  }

  const payload = (await response.json()) as {
    data?: {
      messages?: Record<string, string>;
    };
  };

  return payload.data?.messages ?? {};
};
