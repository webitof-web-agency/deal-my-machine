'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { APP_NAME } from '@/lib/appConfig';
import { STATIC_ADMIN_LOGIN_LOGO, STATIC_ADMIN_PORTAL_LOGO } from '@/lib/staticBranding';

type PortalBrandProps = {
  href: string;
  size?: 'header' | 'footer' | 'login';
  subtitle?: string | null;
  className?: string;
  showSubtitle?: boolean;
};

export default function PortalBrand({
  href,
  size = 'header',
  subtitle,
  className = '',
  showSubtitle = true,
}: PortalBrandProps) {
  const { logoUrl, darkLogoUrl } = useSiteLogo();
  const staticLogoUrl = size === 'login' ? STATIC_ADMIN_LOGIN_LOGO : STATIC_ADMIN_PORTAL_LOGO;
  const dynamicLogoCandidates = useMemo(
    () => [logoUrl, darkLogoUrl].filter(
      (value): value is string => Boolean(value) && value !== staticLogoUrl
    ),
    [logoUrl, darkLogoUrl, staticLogoUrl]
  );
  const dynamicLogoSignature = dynamicLogoCandidates.join('|');
  const [loadedDynamicLogo, setLoadedDynamicLogo] = useState<{ signature: string; url: string | null }>({
    signature: '',
    url: null,
  });

  useEffect(() => {
    if (dynamicLogoCandidates.length === 0) {
      return;
    }

    let cancelled = false;
    let candidateIndex = 0;

    const preloadNextLogo = () => {
      const candidate = dynamicLogoCandidates[candidateIndex];
      candidateIndex += 1;

      if (!candidate) {
        return;
      }

      const image = new window.Image();
      image.onload = () => {
        if (!cancelled) {
          setLoadedDynamicLogo({ signature: dynamicLogoSignature, url: candidate });
        }
      };
      image.onerror = preloadNextLogo;
      image.src = candidate;
    };

    preloadNextLogo();

    return () => {
      cancelled = true;
    };
  }, [dynamicLogoCandidates, dynamicLogoSignature]);

  const activeLogoUrl = loadedDynamicLogo.signature === dynamicLogoSignature
    ? loadedDynamicLogo.url || staticLogoUrl
    : staticLogoUrl;

  const wrapperClass = size === 'footer'
    ? 'max-w-[240px] sm:max-w-[360px]'
    : size === 'login'
      ? 'max-w-[180px] sm:max-w-[220px]'
      : 'max-w-[160px] sm:max-w-[190px]';
  const maxHeightClass = size === 'footer' ? 'max-h-[80px]' : size === 'login' ? 'max-h-[64px]' : 'max-h-[56px]';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Link href={href} className={`inline-flex items-center justify-center ${wrapperClass}`}>
        {activeLogoUrl ? (
          <div className={`relative flex items-center justify-center ${wrapperClass}`}>
            <Image
              key={activeLogoUrl}
              src={activeLogoUrl}
              alt={APP_NAME}
              width={300}
              height={80}
              unoptimized
              priority={size !== 'footer'}
              loading={size === 'footer' ? 'lazy' : 'eager'}
              className={`w-full h-auto object-contain object-center mx-auto ${maxHeightClass}`}
            />
          </div>
        ) : (
          <span className="text-base font-extrabold leading-tight text-white sm:text-lg">
            {APP_NAME}
          </span>
        )}
      </Link>
      {showSubtitle && subtitle ? (
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-gray-400 text-center">{subtitle}</p>
      ) : null}
    </div>
  );
}
