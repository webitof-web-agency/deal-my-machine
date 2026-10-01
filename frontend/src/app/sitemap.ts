import type { MetadataRoute } from "next";
import { generateDealerSlugPath, generateMachineSlugPath } from "@/lib/seoUtils";
import {
  buildMachineLocationCategoryPath,
  buildMachineLocationPath,
  buildSeoCategorySlug,
  buildSeoLocationSlug,
} from '@/lib/seoLocations';
import { SITE_URL } from '@/lib/site';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/api";

type PublicListing = {
  id: string;
  title?: string | null;
  manufacturingYear?: number | string | null;
  locationCity?: string | null;
  locationState?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type PublicDealer = {
  id: string;
  businessName?: string | null;
  district?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const staticRoutes = (): MetadataRoute.Sitemap => [
  {
    url: `${SITE_URL}/`,
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: `${SITE_URL}/machines`,
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/dealers`,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/categories`,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/sold-vehicles`,
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/jobs`,
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/contact-us`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${SITE_URL}/privacy-policy`,
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/terms-and-conditions`,
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/refund-and-return-policy`,
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/disclaimer`,
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listingPayload, dealerPayload, jobPayload] = await Promise.all([
    fetchJson<{ success: boolean; data?: PublicListing[] }>("/master/public-listings"),
    fetchJson<{ success: boolean; data?: PublicDealer[] }>("/master/dealers"),
    fetchJson<{ success: boolean; jobs?: { slug: string; postedAt?: string }[] }>("/recruitment/public/jobs"),
  ]);

  const listings = listingPayload?.success ? listingPayload.data || [] : [];
  const dealers = dealerPayload?.success ? dealerPayload.data || [] : [];
  const jobs = jobPayload?.success ? jobPayload.jobs || [] : [];

  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${SITE_URL}${generateMachineSlugPath(listing)}`,
    changeFrequency: "daily",
    priority: 0.8,
    ...(getLatestDate([listing.updatedAt, listing.createdAt])
      ? { lastModified: getLatestDate([listing.updatedAt, listing.createdAt]) }
      : {}),
  }));

  const dealerRoutes: MetadataRoute.Sitemap = dealers.map((dealer) => ({
    url: `${SITE_URL}${generateDealerSlugPath(dealer)}`,
    changeFrequency: "weekly",
    priority: 0.7,
    ...(getLatestDate([dealer.updatedAt, dealer.createdAt])
      ? { lastModified: getLatestDate([dealer.updatedAt, dealer.createdAt]) }
      : {}),
  }));

  const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
    ...(getLatestDate([job.postedAt]) ? { lastModified: getLatestDate([job.postedAt]) } : {}),
  }));

  const locationGroups = new Map<
    string,
    { city: string; state: string | null; listings: PublicListing[] }
  >();

  listings.forEach((listing) => {
    if (!listing.locationCity) return;

    const locationSlug = buildSeoLocationSlug({
      city: listing.locationCity,
      state: listing.locationState,
    });
    if (!locationSlug) return;

    const existing = locationGroups.get(locationSlug);
    if (existing) {
      existing.listings.push(listing);
      return;
    }

    locationGroups.set(locationSlug, {
      city: listing.locationCity,
      state: listing.locationState || null,
      listings: [listing],
    });
  });

  const locationRoutes: MetadataRoute.Sitemap = Array.from(locationGroups.values()).map((group) => {
    const lastModified = getLatestDate(group.listings.flatMap((listing) => [listing.updatedAt, listing.createdAt]));
    return {
      url: `${SITE_URL}${buildMachineLocationPath({ city: group.city, state: group.state })}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  const locationCategoryGroups = new Map<
    string,
    { city: string; state: string | null; category: string; listings: PublicListing[] }
  >();

  listings.forEach((listing) => {
    if (!listing.locationCity || !listing.category?.name) return;

    const locationSlug = buildSeoLocationSlug({
      city: listing.locationCity,
      state: listing.locationState,
    });
    const categorySlug = buildSeoCategorySlug(listing.category.name);
    if (!locationSlug || !categorySlug) return;

    const key = `${locationSlug}/${categorySlug}`;
    const existing = locationCategoryGroups.get(key);
    if (existing) {
      existing.listings.push(listing);
      return;
    }

    locationCategoryGroups.set(key, {
      city: listing.locationCity,
      state: listing.locationState || null,
      category: listing.category.name,
      listings: [listing],
    });
  });

  const locationCategoryRoutes: MetadataRoute.Sitemap = Array.from(locationCategoryGroups.values()).map((group) => {
    const lastModified = getLatestDate(group.listings.flatMap((listing) => [listing.updatedAt, listing.createdAt]));
    return {
      url: `${SITE_URL}${buildMachineLocationCategoryPath({
        city: group.city,
        state: group.state,
        category: group.category,
      })}`,
      changeFrequency: "daily" as const,
      priority: 0.75,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  return [
    ...staticRoutes(),
    ...listingRoutes,
    ...dealerRoutes,
    ...jobRoutes,
    ...locationRoutes,
    ...locationCategoryRoutes,
  ];
}

function getLatestDate(values: Array<string | undefined>): Date | undefined {
  const timestamps = values
    .filter(Boolean)
    .map((value) => Date.parse(value as string))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return undefined;
  return new Date(Math.max(...timestamps));
}
