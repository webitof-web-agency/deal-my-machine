import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import LocaleSync from "@/components/LocaleSync";
import ToastProvider from "@/components/ToastProvider";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/config";
import { LEGACY_LOCALE_COOKIE_NAME } from '@/lib/storageKeys';
import { DEFAULT_PWA_THEME_COLOR } from '@/lib/staticBranding';
import { APP_NAME, PORTAL_NAME } from '@/lib/appConfig';
import { getAdminFaviconUrl, getSiteBranding } from '@/lib/siteBranding';

const getIconType = (url: string) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.ico')) return 'image/x-icon';
  if (lowerUrl.endsWith('.svg')) return 'image/svg+xml';
  if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerUrl.endsWith('.webp')) return 'image/webp';
  return 'image/png'; // default fallback
};

export async function generateMetadata(): Promise<Metadata> {
  await cookies();
  const branding = await getSiteBranding();
  const faviconUrl = getAdminFaviconUrl(branding.faviconUrl);
  const iconType = getIconType(faviconUrl);

  return {
    title: PORTAL_NAME,
    description: `Internal operations and partner management portal for ${APP_NAME}.`,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: faviconUrl, type: iconType }],
      apple: [{ url: faviconUrl, type: iconType }],
      shortcut: [{ url: faviconUrl, type: iconType }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: DEFAULT_PWA_THEME_COLOR,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? cookieStore.get(LEGACY_LOCALE_COOKIE_NAME)?.value,
  );

  return (
    <html
      lang={locale}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <link rel="preload" as="image" href="/branding/loadinglogo.png" fetchPriority="high" />
        <LocaleSync />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
