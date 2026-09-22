import type { Metadata } from 'next';
import CategoriesPageClient from './CategoriesPageClient';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Machine Categories',
  description: `Browse heavy equipment categories including JCBs, excavators, loaders, and more available across India on ${SITE_NAME}.`,
  alternates: {
    canonical: '/categories',
  },
  openGraph: {
    title: `Machine Categories | ${SITE_NAME}`,
    description: `Browse heavy equipment categories and discover machines listed across India on ${SITE_NAME}.`,
    url: 'https://jcbexchange.com/categories',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Machine Categories | ${SITE_NAME}`,
    description: `Browse heavy equipment categories and discover machines listed across India on ${SITE_NAME}.`,
  },
};

export default function CategoriesPage() {
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Machine Categories | ${SITE_NAME}`,
    description: `Browse heavy equipment categories and discover machines listed across India on ${SITE_NAME}.`,
    url: 'https://jcbexchange.com/categories',
    isPartOf: {
      '@id': 'https://jcbexchange.com/#website',
    },
    about: {
      '@type': 'Thing',
      name: 'Heavy equipment categories',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <CategoriesPageClient />
    </>
  );
}
