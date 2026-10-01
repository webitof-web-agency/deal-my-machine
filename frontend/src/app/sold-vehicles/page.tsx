import type { Metadata } from 'next';
import { Suspense } from 'react';
import SoldVehiclesPageClient from './SoldVehiclesPageClient';
import { getSiteBranding } from '@/lib/siteBranding';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sold Vehicles & Equipment',
  description: `Explore verified heavy machinery and JCB equipment successfully sold through ${SITE_NAME} across India.`,
  alternates: {
    canonical: '/sold-vehicles',
  },
  openGraph: {
    title: `Sold Vehicles & Equipment | ${SITE_NAME}`,
    description: `Explore verified heavy machinery and JCB equipment successfully sold through ${SITE_NAME} across India.`,
    url: `${SITE_URL}/sold-vehicles`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Sold Vehicles & Equipment | ${SITE_NAME}`,
    description: `Explore verified heavy machinery and JCB equipment successfully sold through ${SITE_NAME} across India.`,
  },
};

export default async function SoldVehiclesPage() {
  const branding = await getSiteBranding();
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Sold Vehicles & Equipment | ${SITE_NAME}`,
    description: `Explore verified heavy machinery and JCB equipment successfully sold through ${SITE_NAME} across India.`,
    url: `${SITE_URL}/sold-vehicles`,
    isPartOf: {
      '@id': `${SITE_URL}/#website`,
    },
    about: {
      '@type': 'Thing',
      name: 'Sold heavy machinery listings',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
        <SoldVehiclesPageClient initialLogoUrl={branding.darkLogoUrl || branding.logoUrl} />
      </Suspense>
      </>
    );
}
