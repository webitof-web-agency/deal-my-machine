import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import MachinesPageClient, { type MachineListing } from '../../MachinesPageClient';
import {
  buildMachineLocationCategoryPath,
  buildMachineLocationPath,
  buildSeoLocationSlug,
  formatSeoLocation,
} from '@/lib/seoLocations';
import { buildMachineLocationDescription, buildMachineLocationTitle } from '@/lib/seoKeywords';
import { SITE_NAME, SITE_URL } from '@/lib/site';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

export const dynamic = 'force-dynamic';

type LocationPageProps = {
  params: Promise<{ location: string }>;
};

type LocationListing = Pick<MachineListing, 'locationCity' | 'locationState'>;

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

const findLocation = (listings: LocationListing[], locationSlug: string) => {
  return listings.find((listing) =>
    buildSeoLocationSlug({ city: listing.locationCity, state: listing.locationState }) === locationSlug
  );
};

const getLocationListings = async (locationSlug: string) => {
  const listings = await fetchPublicListings();
  const matchedLocation = findLocation(listings, locationSlug);

  if (!matchedLocation) return null;

  const location = {
    city: matchedLocation.locationCity,
    state: matchedLocation.locationState,
  };
  const locationLabel = formatSeoLocation(location);
  const locationListings = listings.filter((listing) =>
    buildSeoLocationSlug({ city: listing.locationCity, state: listing.locationState }) === locationSlug
  );

  return { listings: locationListings, location, locationLabel };
};

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { location: locationSlug } = await params;
  const result = await getLocationListings(locationSlug);

  if (!result) {
    return {
      title: `Heavy Machinery for Sale | ${SITE_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  const { location, locationLabel } = result;
  const title = buildMachineLocationTitle({
    city: location.city,
    state: location.state,
  });
  const description = buildMachineLocationDescription({
    city: location.city,
    state: location.state,
  });
  const canonical = buildMachineLocationPath({
    city: location.city,
    state: location.state,
  });

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description: `${description} Find verified listings in ${locationLabel}.`,
      url: `${SITE_URL}${canonical}`,
      type: 'website',
    },
  };
}

export default async function MachineLocationPage({ params }: LocationPageProps) {
  const { location: locationSlug } = await params;
  const result = await getLocationListings(locationSlug);

  if (!result || result.listings.length === 0) notFound();

  const { listings, location, locationLabel } = result;
  const canonical = buildMachineLocationPath({
    city: location.city,
    state: location.state,
  });
  const title = buildMachineLocationTitle({
    city: location.city,
    state: location.state,
  });
  const description = buildMachineLocationDescription({
    city: location.city,
    state: location.state,
  });
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: `${SITE_URL}${canonical}`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: {
      '@type': 'Place',
      name: locationLabel,
    },
    numberOfItems: listings.length,
  };
  const categoryLinks = Array.from(
    new Map(
      listings
        .filter((listing) => listing.category?.name)
        .map((listing) => [listing.category!.id, listing.category!]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <nav aria-label="Machine location breadcrumb" className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-5 pt-5 text-xs font-semibold text-slate-500 sm:px-8 lg:px-10">
        <Link href="/" className="hover:text-amber-700">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/machines" className="hover:text-amber-700">Machines</Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900">{locationLabel}</span>
      </nav>
      {categoryLinks.length > 0 && (
        <nav aria-label={`Machine categories in ${locationLabel}`} className="mx-auto max-w-[1400px] px-5 pt-3 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Browse in {locationLabel}:</span>
            {categoryLinks.map((category) => (
              <Link
                key={category.id}
                href={buildMachineLocationCategoryPath({
                  city: location.city,
                  state: location.state,
                  category: category.name,
                })}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:border-amber-400 hover:text-amber-700"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
      <Suspense fallback={<div className="min-h-screen bg-[#f3f4f6]" />}>
        <MachinesPageClient
          initialLocation={locationLabel}
          initialHeading={title}
          initialMachines={listings}
        />
      </Suspense>
    </>
  );
}
