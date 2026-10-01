import type { MetadataRoute } from 'next';
import { DEFAULT_PWA_BACKGROUND_COLOR, DEFAULT_PWA_THEME_COLOR } from '@/lib/staticBranding';
import { APP_NAME, PORTAL_NAME } from '@/lib/appConfig';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const icons: NonNullable<MetadataRoute.Manifest['icons']> = [
    {
      src: '/icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any',
    },
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
