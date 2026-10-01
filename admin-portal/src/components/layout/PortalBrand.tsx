'use client';

import Image from 'next/image';
import Link from 'next/link';
import { APP_NAME } from '@/lib/appConfig';
import { getStaticPortalLogo } from '@/lib/staticPortalLogo.mjs';

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
  const staticLogoUrl = getStaticPortalLogo(size);

  const wrapperClass = size === 'footer'
    ? 'max-w-[240px] sm:max-w-[360px]'
    : size === 'login'
      ? 'max-w-[180px] sm:max-w-[220px]'
      : 'max-w-[160px] sm:max-w-[190px]';
  const maxHeightClass = size === 'footer' ? 'max-h-[80px]' : size === 'login' ? 'max-h-[64px]' : 'max-h-[56px]';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Link href={href} className={`inline-flex items-center justify-center ${wrapperClass}`}>
        <div className={`relative flex items-center justify-center ${wrapperClass}`}>
          <Image
            src={staticLogoUrl}
            alt={APP_NAME}
            width={300}
            height={80}
            priority={size !== 'footer'}
            loading={size === 'footer' ? 'lazy' : 'eager'}
            className={`w-full h-auto object-contain object-center mx-auto ${maxHeightClass}`}
          />
        </div>
      </Link>
      {showSubtitle && subtitle ? (
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-gray-400 text-center">{subtitle}</p>
      ) : null}
    </div>
  );
}
