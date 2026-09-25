'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getAbsoluteFileUrl } from '@/lib/fileUpload';
import { SITE_NAME } from '@/lib/site';

type SiteBrandProps = {
  href?: string;
  variant?: 'navbar' | 'footer';
  align?: 'left' | 'center';
};

export default function SiteBrand({
  href = '/',
  variant = 'navbar',
  align = 'left',
}: SiteBrandProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [footerLogoUrl, setFooterLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLogo = async () => {
      try {
        const response = await api.get<{ data?: { imageUrl?: string | null; footerLogoUrl?: string | null } }>('/master/site-logo');
        if (!isMounted) {
          return;
        }

        setLogoUrl(getAbsoluteFileUrl(response.data?.data?.imageUrl || null) || null);
        setFooterLogoUrl(getAbsoluteFileUrl(response.data?.data?.footerLogoUrl || null) || null);
      } catch {
        if (isMounted) {
          setLogoUrl(null);
        }
      }
    };

    void loadLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  const widthClass = variant === 'footer'
    ? 'w-full max-w-[240px] md:max-w-[360px]'
    : 'w-full max-w-[200px] sm:max-w-[240px] md:max-w-[300px]';

  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${widthClass}`}>
      {(variant === 'footer' ? footerLogoUrl || logoUrl : logoUrl) ? (
        <div className={`relative flex items-center ${widthClass}`}>
          <Image
            src={(variant === 'footer' ? footerLogoUrl || logoUrl : logoUrl) as string}
            alt={SITE_NAME}
            width={300}
            height={80}
            sizes={variant === 'footer' ? '(max-width: 768px) 240px, 360px' : '(max-width: 640px) 200px, (max-width: 768px) 240px, 300px'}
            unoptimized
            priority={variant === 'navbar'}
            loading={variant === 'navbar' ? 'eager' : 'lazy'}
            style={{ width: '100%', height: 'auto' }}
            className={`object-contain ${align === 'center' ? 'object-center mx-auto' : 'object-left'} ${variant === 'footer' ? 'max-h-[80px]' : 'max-h-[54px]'}`}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFC107] text-black shadow-xs font-black border border-amber-300">
            <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
              <path d="M19.5 14c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM4.5 14c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM22 15.5c0-1.38-1.12-2.5-2.5-2.5h-1.07c-.43-1.46-1.78-2.5-3.43-2.5h-2v-2.5c0-.83-.67-1.5-1.5-1.5H8.5c-.83 0-1.5.67-1.5 1.5V9H5c-1.65 0-3 1.35-3 3v3.5C2 16.88 3.12 18 4.5 18h15c1.38 0 2.5-1.12 2.5-2.5zM12 9v1.5H8.5V9H12zm-3.5 4h8c.83 0 1.5.67 1.5 1.5H6c0-.83.67-1.5 1.5-1.5z"/>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1 font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 uppercase">
              <span>JCB</span>
              <span className="text-amber-500">EXCHANGE</span>
            </div>
            <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">Heavy Machinery</span>
          </div>
        </div>
      )}
    </Link>
  );
}
