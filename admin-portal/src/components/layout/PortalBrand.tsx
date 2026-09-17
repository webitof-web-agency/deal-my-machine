'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { APP_NAME } from '@/lib/appConfig';

type PortalBrandProps = {
  href: string;
  size?: 'header' | 'footer';
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
  const logoCandidates = useMemo(
    () => [logoUrl, darkLogoUrl].filter((value): value is string => Boolean(value)),
    [logoUrl, darkLogoUrl]
  );
  const logoSignature = logoCandidates.join('|');
  const [failedLogoState, setFailedLogoState] = useState<{ signature: string; urls: string[] }>({
    signature: '',
    urls: [],
  });
  const failedLogoUrls = failedLogoState.signature === logoSignature ? failedLogoState.urls : [];
  const activeLogoUrl = logoCandidates.find((candidate) => !failedLogoUrls.includes(candidate)) || null;

  const wrapperClass = size === 'footer'
    ? 'max-w-[240px] sm:max-w-[360px]'
    : 'max-w-[160px] sm:max-w-[190px]';
  const maxHeightClass = size === 'footer' ? 'max-h-[80px]' : 'max-h-[56px]';

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
              priority={size === 'header'}
              loading={size === 'header' ? 'eager' : 'lazy'}
              className={`w-full h-auto object-contain object-center mx-auto ${maxHeightClass}`}
              onError={() => {
                setFailedLogoState((current) => {
                  const urls = current.signature === logoSignature ? current.urls : [];
                  if (urls.includes(activeLogoUrl)) {
                    return current;
                  }

                  return {
                    signature: logoSignature,
                    urls: [...urls, activeLogoUrl],
                  };
                });
              }}
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
