import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import MachinesPageClient, { type MachineListing } from '../../../MachinesPageClient';
import {
  buildMachineLocationCategoryPath,
  buildMachineLocationPath,
  buildSeoCategorySlug,
  buildSeoLocationSlug,
  formatSeoLocation,
} from '@/lib/seoLocations';
import { buildMachineLocationDescription, buildMachineLocationTitle } from '@/lib/seoKeywords';
import { SITE_NAME, SITE_URL } from '@/lib/site';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

export const dynamic = 'force-dynamic';

type LocationCategoryPageProps = {
  params: Promise<{ location: string; category: string }>;
};

type PublicListingsPayload = {
  success?: boolean;
  data?: MachineListing[];
};

const fetchPublicListings = async (): Promise<MachineListing[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/master/public-listings`, { cache: 'no-store' });
    if (!response.ok) return [];

    const payload = (await response.json()) as PublicListingsPayload;
    return payload.success && Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
};

const getLocationCategoryListings = async (locationSlug: string, categorySlug: string) => {
  const listings = await fetchPublicListings();
  const locationListing = listings.find((listing) =>
    buildSeoLocationSlug({ city: listing.locationCity, state: listing.locationState }) === locationSlug
  );

  if (!locationListing?.category) return null;

  const categoryListing = listings.find((listing) =>
    buildSeoLocationSlug({ city: listing.locationCity, state: listing.locationState }) === locationSlug &&
    listing.category?.name &&
    buildSeoCategorySlug(listing.category.name) === categorySlug
  );

  if (!categoryListing?.category) return null;

  const location = {
    city: categoryListing.locationCity,
    state: categoryListing.locationState,
  };
  const category = categoryListing.category;
  const matchingListings = listings.filter((listing) =>
    buildSeoLocationSlug({ city: listing.locationCity, state: listing.locationState }) === locationSlug &&
    listing.category?.id === category.id
  );

  return {
    listings: matchingListings,
    location,
    locationLabel: formatSeoLocation(location),
    category,
  };
};

export async function generateMetadata({ params }: LocationCategoryPageProps): Promise<Metadata> {
  const { location: locationSlug, category: categorySlug } = await params;
  const result = await getLocationCategoryListings(locationSlug, categorySlug);

  if (!result) {
    return {
      title: `Construction Machinery for Sale | ${SITE_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  const title = buildMachineLocationTitle({
    category: result.category.name,
    city: result.location.city,
    state: result.location.state,
  });
  const description = buildMachineLocationDescription({
    category: result.category.name,
    city: result.location.city,
    state: result.location.state,
  });
  const canonical = buildMachineLocationCategoryPath({
    city: result.location.city,
    state: result.location.state,
    category: result.category.name,
  });

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${canonical}`,
      type: 'website',
    },
  };
}

export default async function MachineLocationCategoryPage({ params }: LocationCategoryPageProps) {
  const { location: locationSlug, category: categorySlug } = await params;
  const result = await getLocationCategoryListings(locationSlug, categorySlug);

  if (!result || result.listings.length === 0) notFound();

  const title = buildMachineLocationTitle({
    category: result.category.name,
    city: result.location.city,
    state: result.location.state,
  });
  const description = buildMachineLocationDescription({
    category: result.category.name,
    city: result.location.city,
    state: result.location.state,
  });
  const canonical = buildMachineLocationCategoryPath({
    city: result.location.city,
    state: result.location.state,
    category: result.category.name,
  });
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: `${SITE_URL}${canonical}`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: {
      '@type': 'Thing',
      name: `${result.category.name} machines in ${result.locationLabel}`,
    },
    numberOfItems: result.listings.length,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <nav aria-label="Machine category breadcrumb" className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-5 pt-5 text-xs font-semibold text-slate-500 sm:px-8 lg:px-10">
        <Link href="/" className="hover:text-amber-700">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/machines" className="hover:text-amber-700">Machines</Link>
        <span aria-hidden="true">/</span>
        <Link
          href={buildMachineLocationPath({ city: result.location.city, state: result.location.state })}
          className="hover:text-amber-700"
        >
          {result.locationLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900">{result.category.name}</span>
      </nav>
      <Suspense fallback={<div className="min-h-screen bg-[#f3f4f6]" />}>
        <MachinesPageClient
          initialCategoryId={result.category.id}
          initialLocation={result.locationLabel}
          initialHeading={title}
          initialMachines={result.listings}
        />
      </Suspense>
    </>
  );
}
