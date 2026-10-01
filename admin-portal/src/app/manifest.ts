import type { MetadataRoute } from 'next';
import { DEFAULT_PWA_BACKGROUND_COLOR, DEFAULT_PWA_THEME_COLOR } from '@/lib/staticBranding';
import { APP_NAME, PORTAL_NAME } from '@/lib/appConfig';
import { getAdminFaviconUrl, getSiteBranding } from '@/lib/siteBranding';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await getSiteBranding();
  const iconUrl = getAdminFaviconUrl(branding.manifestIconUrl || branding.faviconUrl);
  const isSvg = iconUrl.toLowerCase().includes('.svg');
  const icons: NonNullable<MetadataRoute.Manifest['icons']> = isSvg
    ? [{ src: iconUrl, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
    : [
      { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ];

  return {
    id: '/',
    name: PORTAL_NAME,
    short_name: PORTAL_NAME,
    description: `Internal operations and partner management portal for ${APP_NAME}.`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    prefer_related_applications: false,
    background_color: DEFAULT_PWA_BACKGROUND_COLOR,
    theme_color: DEFAULT_PWA_THEME_COLOR,
    icons,
  };
}
