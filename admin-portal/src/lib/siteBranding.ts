import { cache } from 'react';

type SiteBrandingResponse = {
  data?: {
    faviconUrl?: string | null;
    manifestIconUrl?: string | null;
    updatedAt?: string | null;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
const STATIC_ADMIN_FAVICON = '/icon.svg';

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL.replace(/\/api\/?$/, '')}${value.startsWith('/') ? value : `/${value}`}`;
};

const appendVersionToUrl = (value: string | null, version?: string | null) => {
  if (!value || !version) return value;
  return `${value}${value.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
};

export const getSiteBranding = cache(async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/master/site-logo`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load site branding.');

    const payload = (await response.json()) as SiteBrandingResponse;
    const updatedAt = payload.data?.updatedAt || null;

    return {
      faviconUrl: appendVersionToUrl(toAbsoluteUrl(payload.data?.faviconUrl), updatedAt),
      manifestIconUrl: appendVersionToUrl(toAbsoluteUrl(payload.data?.manifestIconUrl), updatedAt),
    };
  } catch {
    return {
      faviconUrl: null,
      manifestIconUrl: null,
    };
  }
});

export const getAdminFaviconUrl = (value?: string | null) => value || STATIC_ADMIN_FAVICON;
