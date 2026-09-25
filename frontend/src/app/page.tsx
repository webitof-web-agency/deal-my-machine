"use client";

import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ArrowRight, Package, Building2, Users, Heart, LayoutGrid, IndianRupee, MessageSquare, Check } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import api, { API_ORIGIN } from '@/lib/api';
import { generateMachineSlugPath } from '@/lib/seoUtils';
import { shuffleFeaturedListings } from '@/lib/shuffleFeaturedListings';
import { useTranslation } from '@/hooks/useTranslation';
import CategoryIconRenderer from '@/components/shared/CategoryIconRenderer';
import { SITE_NAME } from '@/lib/site';

type FinanceSupportItem = {
  id: string;
  name: string;
  imageUrl: string;
  displayOrder: number;
};

type InspectionSectionContent = {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

type PublicCategory = {
  id: string;
  name: string;
  count: number;
  featuredImage: string | null;
  icon?: {
    id: string;
    name: string;
    svgData: string;
  } | null;
};

type PublicSearchLocation = {
  name: string;
  count: number;
};

type PublicSearchFilters = {
  categories: PublicCategory[];
  locations: PublicSearchLocation[];
};

type PublicHomeStats = {
  counts: {
    machines: number;
    customers: number;
    dealers: number;
  };
  brands: Array<{
    id: string;
    name: string;
  }>;
};

type HomepageListing = {
  id: string;
  title: string;
  price: number;
  locationCity: string;
  locationState?: string | null;
  status: string;
  categoryName?: string | null;
  brandName?: string | null;
  featuredImage: string | null;
  createdAt: string;
  manufacturingYear?: number | null;
  operatingHours?: number | null;
};

const getListingStatusBadge = (status?: string | null) => {
  const normalizedStatus = String(status || '').trim().toUpperCase();

  if (normalizedStatus === 'SOLD') {
    return 'bg-red-600 text-white font-black';
  }

  if (normalizedStatus === 'RESERVED') {
    return 'bg-amber-500 text-white font-black';
  }

  return 'bg-[#FFC107] text-black font-black';
};

const getListingStatusLabel = (
  status: string | null | undefined,
  labels: {
    sold: string;
    reserved: string;
    available: string;
  }
) => {
  const normalizedStatus = String(status || '').trim().toUpperCase();

  if (normalizedStatus === 'SOLD') {
    return labels.sold;
  }

  if (normalizedStatus === 'RESERVED') {
    return labels.reserved;
  }

  return labels.available;
};

const getMediaUrl = (url: string | null) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

export default function Home() {
  const { t } = useTranslation();
  const { recentListings, fetchRecentListings } = useNotificationStore();
  const listingStatusLabels = React.useMemo(
    () => ({
      sold: t('machines.sold', 'Sold'),
      reserved: t('machines.reserved', 'Reserved'),
      available: t('machines.available', 'Available'),
    }),
    [t]
  );
  const [financeSupportItems, setFinanceSupportItems] = React.useState<FinanceSupportItem[]>([]);
  const [failedFinanceSupportIds, setFailedFinanceSupportIds] = React.useState<Set<string>>(() => new Set());
  const [heroImageUrl, setHeroImageUrl] = React.useState<string | null>(null);
  const [heroHeadline, setHeroHeadline] = React.useState('');
  const [inspectionContent, setInspectionContent] = React.useState<InspectionSectionContent | null>(null);
  const [inspectionImageFailed, setInspectionImageFailed] = React.useState(false);
  const [browseCategories, setBrowseCategories] = React.useState<PublicCategory[]>([]);
  const [searchLocations, setSearchLocations] = React.useState<PublicSearchLocation[]>([]);
  const [homeStats, setHomeStats] = React.useState<PublicHomeStats | null>(null);
  const [featuredMachines, setFeaturedMachines] = React.useState<HomepageListing[]>([]);

  // Hero Search States
  const router = useRouter();
  const [heroSearchQuery, setHeroSearchQuery] = React.useState('');
  const [heroSearchLocation, setHeroSearchLocation] = React.useState('');
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = React.useState(false);

  const handleHeroSearch = () => {
    const params = new URLSearchParams();
    if (heroSearchQuery.trim()) params.set('q', heroSearchQuery.trim());
    if (heroSearchLocation.trim()) params.set('location', heroSearchLocation.trim());
    router.push(`/machines?${params.toString()}`);
  };

  const visibleLocationSuggestions = React.useMemo(() => {
    const query = heroSearchLocation.trim().toLowerCase();
    const source = searchLocations;

    if (!query) {
      return source.slice(0, 6);
    }

    return source
      .filter((location) => location.name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [heroSearchLocation, searchLocations]);

  const heroHeadlineLines = React.useMemo(
    () => heroHeadline.split('\n').map((line) => line.trim()).filter((line) => line.length > 0),
    [heroHeadline]
  );
  const heroHeadlineAccentLineIndex = Math.max(heroHeadlineLines.length - 1, 0);
  const bottomBannerTitle = inspectionContent?.title?.trim() || "Let's Get to Work";
  const bottomBannerDescription = inspectionContent?.description?.trim()
    || 'Explore thousands of verified heavy equipment listings or connect directly with certified dealers across India.';
  const bottomBannerTitleLines = bottomBannerTitle
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const bottomBannerAccentLineIndex = Math.max(bottomBannerTitleLines.length - 1, 0);
  const formatHeroCount = React.useCallback((value?: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '-';
    }

    if (value >= 1000) {
      return `${new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)}+`;
    }

    return value === 0 ? '0' : `${value.toLocaleString('en-IN')}+`;
  }, []);
  const uniqueFinanceSupportItems = React.useMemo(() => {
    const seen = new Set<string>();
    return financeSupportItems.filter((item) => {
      if (!item.imageUrl) return false;

      const key = `${item.id}:${item.name.trim().toLowerCase()}:${item.imageUrl}`;
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }, [financeSupportItems]);
  React.useEffect(() => {
    void fetchRecentListings();
  }, [fetchRecentListings]);

  React.useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [financeRes, heroRes, inspectionRes, categoriesRes, filtersRes, homeStatsRes, publicListingsRes] = await Promise.all([
          api.get<{ success: boolean; data: FinanceSupportItem[] }>('/master/finance-support').catch(() => null),
          api.get<{ success: boolean; data: { imageUrl: string | null; headline?: string | null } }>('/master/hero-image').catch(() => null),
          api.get<{ success: boolean; data: InspectionSectionContent }>('/master/inspection-section').catch(() => null),
          api.get<{ success: boolean; data: PublicCategory[] }>('/master/public-categories').catch(() => null),
          api.get<{ success: boolean; data: PublicSearchFilters }>('/master/public-search-filters').catch(() => null),
          api.get<{ success: boolean; data: PublicHomeStats }>('/master/public-home-stats').catch(() => null),
          api.get<{ success: boolean; data: HomepageListing[] }>('/master/public-listings').catch(() => null),
        ]);

        if (cancelled) return;

        if (financeRes?.data?.success) {
          setFinanceSupportItems(financeRes.data.data || []);
          setFailedFinanceSupportIds(new Set());
        } else {
          setFinanceSupportItems([]);
        }

        if (heroRes?.data?.success && heroRes.data.data?.imageUrl) {
          setHeroImageUrl(heroRes.data.data.imageUrl);
        }

        if (heroRes?.data?.success) {
          setHeroHeadline(heroRes.data.data?.headline || '');
        } else {
          setHeroHeadline('');
        }

        if (inspectionRes?.data?.success) {
          setInspectionContent(inspectionRes.data.data || null);
          setInspectionImageFailed(false);
        } else {
          setInspectionContent(null);
        }

        if (categoriesRes?.data?.success) {
          setBrowseCategories(categoriesRes.data.data || []);
        } else {
          setBrowseCategories([]);
        }

        if (filtersRes?.data?.success) {
          setSearchLocations(filtersRes.data.data?.locations || []);
        } else {
          setSearchLocations([]);
        }

        if (homeStatsRes?.data?.success) {
          setHomeStats(homeStatsRes.data.data || null);
        } else {
          setHomeStats(null);
        }

        if (publicListingsRes?.data?.success) {
          setFeaturedMachines(shuffleFeaturedListings(publicListingsRes.data.data || []));
        } else {
          setFeaturedMachines([]);
        }

      } catch {
        if (!cancelled) {
          setFinanceSupportItems([]);
          setHeroHeadline('');
          setInspectionContent(null);
          setHeroImageUrl(null);
          setBrowseCategories([]);
          setSearchLocations([]);
          setHomeStats(null);
          setFeaturedMachines([]);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const financeDisplayItems = React.useMemo(
    () => uniqueFinanceSupportItems.filter((item) => item.imageUrl && !failedFinanceSupportIds.has(item.id)),
    [failedFinanceSupportIds, uniqueFinanceSupportItems]
  );
  const financeMarqueeItems = React.useMemo(
    () => Array.from({ length: 4 }).flatMap(() => financeDisplayItems),
    [financeDisplayItems]
  );

  const renderFinanceCard = (item: FinanceSupportItem, key: string) => (
    <div
      key={key}
      className="group relative flex h-[54px] w-[130px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white px-4 shadow-xs transition-all duration-200 hover:border-amber-300 hover:shadow-md sm:h-[62px] sm:w-[150px]"
    >
      <Image
        src={getMediaUrl(item.imageUrl) || item.imageUrl}
        alt={`${item.name} finance support partner on ${SITE_NAME}`}
        fill
        sizes="(max-width: 640px) 130px, 150px"
        className="object-contain p-3"
        onError={() => {
          setFailedFinanceSupportIds((current) => {
            const next = new Set(current);
            next.add(item.id);
            return next;
          });
        }}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/85 px-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-gray-900">
          {item.name}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">

      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[560px] overflow-hidden md:h-[600px]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 bg-[#1C1C1C]">
          {heroImageUrl ? (
            <Image
              src={getMediaUrl(heroImageUrl) || heroImageUrl}
              alt="Heavy machinery marketplace hero banner"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1200px] flex-col justify-center px-4 pb-8 pt-24 sm:px-6 md:pb-10 md:pt-20">
          <div className="max-w-[720px]">
            {heroHeadlineLines.length > 0 ? (
              <h1 className="max-w-[700px] text-[30px] font-extrabold leading-[1.08] tracking-normal text-white drop-shadow-lg sm:text-5xl md:text-6xl">
                {heroHeadlineLines.map((line, index) => {
                  const words = line.split(/\s+/).filter(Boolean);
                  const shouldAccentLastWord = index === heroHeadlineAccentLineIndex && words.length > 1;
                  const baseLine = shouldAccentLastWord ? words.slice(0, -1).join(' ') : line;
                  const accentWord = shouldAccentLastWord ? words[words.length - 1] : '';

                  return (
                    <React.Fragment key={`${line}-${index}`}>
                      {index > 0 ? <br /> : null}
                      {baseLine}
                      {accentWord ? (
                        <>
                          {' '}
                          <span className="text-jcb-yellow">{accentWord}</span>
                        </>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </h1>
            ) : (
              <h1 className="max-w-[700px] text-[30px] font-extrabold leading-[1.08] tracking-normal text-white drop-shadow-lg sm:text-5xl md:text-6xl">
                Heavy Machines
                <br />
                <span className="text-jcb-yellow">Bigger</span> Opportunities
              </h1>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative z-30 mt-7 w-full max-w-[640px]">
            <div className="relative flex w-full flex-col gap-2 rounded-md border border-white/30 bg-white/95 p-2 shadow-2xl backdrop-blur-sm sm:flex-row">

            {/* Input 1 */}
            <div className="flex min-h-[48px] flex-1 items-center rounded-[4px] border border-gray-200 bg-white px-3 transition-colors hover:border-gray-300 focus-within:border-jcb-yellow">
              <Search className="mr-2.5 h-4 w-4 shrink-0 text-gray-500 sm:h-5 sm:w-5" />
              <div className="flex flex-col w-full">
                <input 
                  type="text" 
                  placeholder={t('home.searchPlaceholder')}
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                  className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none placeholder:text-gray-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Input 3 */}
            <div className="relative z-40 sm:w-[180px]">
              <div className="flex min-h-[48px] items-center rounded-[4px] border border-gray-200 bg-white px-3 transition-colors hover:border-gray-300 focus-within:border-jcb-yellow">
                <MapPin className="mr-2.5 h-4 w-4 shrink-0 text-gray-500 sm:h-5 sm:w-5" />
                <div className="flex flex-col w-full">
                  <input 
                    type="text" 
                    placeholder={t('home.enterLocation')}
                    value={heroSearchLocation}
                    onFocus={() => setIsLocationSuggestionsOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsLocationSuggestionsOpen(false), 120);
                    }}
                    onChange={(e) => {
                      setHeroSearchLocation(e.target.value);
                      setIsLocationSuggestionsOpen(true);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                    className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none placeholder:text-gray-500 sm:text-sm"
                  />
                </div>
              </div>
              {isLocationSuggestionsOpen && visibleLocationSuggestions.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[220px] min-w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-[0_18px_45px_rgba(15,23,42,0.22)] ring-1 ring-black/5 sm:bottom-[calc(100%+8px)] sm:left-auto sm:right-0 sm:top-auto sm:w-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {visibleLocationSuggestions.map((location) => (
                    <button
                      key={location.name}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setHeroSearchLocation(location.name);
                        setIsLocationSuggestionsOpen(false);
                      }}
                      className="flex w-full cursor-pointer items-center justify-between border-b border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-amber-50 focus-visible:bg-amber-50 focus-visible:outline-none last:border-b-0"
                    >
                      <span className="truncate">{location.name}</span>
                      <span className="ml-4 shrink-0 text-xs text-gray-400">({location.count})</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleHeroSearch}
              className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-jcb-yellow px-6 text-sm font-extrabold text-black shadow-sm transition-colors hover:bg-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            >
              <Search className="h-4 w-4" strokeWidth={2.8} />
              {t('home.searchButton')}
            </button>

            </div>
          </div>

          <div className="mt-4 w-full max-w-[640px]">
          {homeStats?.brands?.length ? (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold text-white/90">
                Popular:
              </span>
              {homeStats.brands.slice(0, 7).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/machines?q=${encodeURIComponent(brand.name)}`}
                  className="rounded-full border border-white/45 bg-white/15 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm transition-colors hover:border-jcb-yellow hover:bg-jcb-yellow hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jcb-yellow"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="grid max-w-[560px] grid-cols-3 divide-x divide-white/25 text-white">
            <div className="flex items-center gap-2 pr-3 text-left sm:gap-3">
              <Package className="hidden h-7 w-7 shrink-0 text-jcb-yellow sm:block" />
              <div>
                <p className="text-lg font-extrabold leading-none sm:text-2xl">{formatHeroCount(homeStats?.counts.machines)}</p>
                <p className="mt-1 text-[9px] font-semibold leading-tight text-white/85 sm:text-[11px]">Machines Listed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 text-left sm:gap-3">
              <Users className="hidden h-7 w-7 shrink-0 text-jcb-yellow sm:block" />
              <div>
                <p className="text-lg font-extrabold leading-none sm:text-2xl">{formatHeroCount(homeStats?.counts.customers)}</p>
                <p className="mt-1 text-[9px] font-semibold leading-tight text-white/85 sm:text-[11px]">Happy Customers</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-3 text-left sm:gap-3">
              <Building2 className="hidden h-7 w-7 shrink-0 text-jcb-yellow sm:block" />
              <div>
                <p className="text-lg font-extrabold leading-none sm:text-2xl">{formatHeroCount(homeStats?.counts.dealers)}</p>
                <p className="mt-1 text-[9px] font-semibold leading-tight text-white/85 sm:text-[11px]">Trusted Dealers</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* 2. BROWSE BY CATEGORY (Redesigned to match reference image) */}
      <section className="bg-white px-4 py-9 sm:px-6 sm:py-10 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-row items-center justify-between">
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Browse by <span className="text-[#D97706]">Category</span>
            </h2>
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-bold text-gray-700 hover:text-amber-600 flex items-center gap-1.5 transition-colors group"
            >
              <span>View All Categories</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5 sm:gap-4">
            {browseCategories.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={`cat-skel-${i}`} className="bg-white border border-gray-200/70 rounded-xl p-4 flex flex-col items-center justify-center animate-pulse h-44 sm:h-48">
                  <div className="h-24 w-full bg-gray-100 rounded-xl mb-3"></div>
                  <div className="h-3 w-16 bg-gray-100 rounded"></div>
                </div>
              ))
            ) : (
              <>
                {browseCategories.slice(0, 7).map((category) => (
                  <Link
                    key={category.id}
                    href={`/machines?category=${category.id}`}
                    className="bg-white border border-gray-200/90 rounded-xl p-3 sm:p-3.5 flex flex-col items-center justify-between text-center hover:border-amber-400 hover:shadow-lg transition-all duration-300 group cursor-pointer h-44 sm:h-48 shadow-2xs"
                  >
                    <div className="relative w-full h-28 sm:h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50/90 p-2 mb-2">
                      {category.featuredImage ? (
                        <Image
                          src={getMediaUrl(category.featuredImage) || category.featuredImage}
                          alt={category.name}
                          fill
                          sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 220px"
                          className="object-contain p-1 group-hover:scale-108 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-14 w-14 flex items-center justify-center">
                          <CategoryIconRenderer
                            svgData={category.icon?.svgData}
                            name={category.name}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-gray-900 line-clamp-2 text-center leading-snug group-hover:text-amber-600 transition-colors capitalize mt-auto">
                      {category.name}
                    </span>
                  </Link>
                ))}

                {/* All Categories Card (8th card in grid) */}
                <Link
                  href="/categories"
                  className="bg-white border border-gray-200/90 rounded-xl p-3 sm:p-3.5 flex flex-col items-center justify-between text-center hover:border-amber-400 hover:shadow-lg transition-all duration-300 group cursor-pointer h-44 sm:h-48 shadow-2xs"
                >
                  <div className="relative w-full h-28 sm:h-32 flex items-center justify-center rounded-xl bg-amber-50/70 group-hover:bg-amber-100/90 transition-colors mb-2">
                    <LayoutGrid className="h-8 w-8 text-amber-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-amber-600 transition-colors mt-auto leading-snug">
                    All Categories
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. FEATURED MACHINES (Redesigned to match reference image) */}
      <section className="bg-white px-4 pb-11 pt-3 sm:px-6 sm:pb-12 sm:pt-4 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-row items-center justify-between">
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Featured <span className="text-[#D97706]">Machines</span>
            </h2>
            <Link
              href="/machines"
              className="text-xs sm:text-sm font-bold text-gray-700 hover:text-amber-600 flex items-center gap-1.5 transition-colors group"
            >
              <span>View All Machines</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredMachines.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`mach-skel-${i}`} className="bg-white border border-gray-200/80 rounded-xl overflow-hidden animate-pulse h-[340px] flex flex-col p-4">
                  <div className="h-48 bg-gray-100 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-100 rounded mt-auto"></div>
                </div>
              ))
            ) : (
              featuredMachines.slice(0, 4).map((listing) => {
                const img = getMediaUrl(listing.featuredImage);
                return (
                  <Link
                    href={generateMachineSlugPath(listing)}
                    key={listing.id}
                    className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col"
                  >
                    {/* Image Area */}
                    <div className="relative h-48 sm:h-52 w-full bg-gray-100 overflow-hidden">
                      {img ? (
                        <Image
                          src={img}
                          alt={`${listing.title} available in ${listing.locationCity || 'India'}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                          <Package className="w-12 h-12 stroke-[1.5]" />
                        </div>
                      )}

                      {/* Top-left Badge (Dynamic Status) */}
                      <div
                        className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider shadow-xs ${getListingStatusBadge(
                          listing.status
                        )}`}
                      >
                        {getListingStatusLabel(listing.status, listingStatusLabels)}
                      </div>

                      {/* Top-right Wishlist Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 flex items-center justify-center shadow-sm backdrop-blur-xs transition-colors"
                        aria-label="Add to wishlist"
                      >
                        <Heart size={16} strokeWidth={2.2} />
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 sm:p-5 flex flex-col flex-grow">
                      <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-amber-600 transition-colors mb-1.5">
                        {listing.title}
                      </h3>

                      {/* Specs Line: Year | Hours | Location */}
                      <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5 flex-wrap mb-4">
                        <span>{listing.manufacturingYear || '—'}</span>
                        <span className="text-gray-300">|</span>
                        <span>{listing.operatingHours ? `${listing.operatingHours.toLocaleString('en-IN')} Hours` : 'Hours —'}</span>
                        <span className="text-gray-300">|</span>
                        <span className="truncate max-w-[100px]">{listing.locationCity || 'India'}</span>
                      </p>

                      {/* Bottom Price & View Details */}
                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
                            ₹ {(listing.price / 100000).toFixed(2)} Lakh
                          </p>
                        </div>
                        <span className="rounded-xl bg-gray-100 group-hover:bg-[#FFC107] text-gray-900 group-hover:text-black px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs">
                          View Details
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION (Placed right below Featured Machines) */}
      <section className="bg-white border-t border-gray-100 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          {/* Header Row */}
          <div className="mb-8 sm:mb-10 flex flex-row items-center justify-between">
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              How It Works
            </h2>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
            {/* Step 01 */}
            <div className="relative flex flex-col pl-4 sm:pl-6 lg:border-l lg:border-gray-200">
              <div className="hidden lg:block absolute -left-[5px] top-3.5 w-2 h-2 border-t border-r border-gray-300 bg-white rotate-45" />

              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-300">01</span>
                <Search className="w-8 h-8 text-gray-900 stroke-[2]" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1">
                Search
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-snug max-w-[210px]">
                Find the right machine from thousands of listings.
              </p>
            </div>

            {/* Step 02 */}
            <div className="relative flex flex-col pl-4 sm:pl-6 lg:border-l lg:border-gray-200">
              <div className="hidden lg:block absolute -left-[5px] top-3.5 w-2 h-2 border-t border-r border-gray-300 bg-white rotate-45" />

              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-300">02</span>
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-xs">
                  <IndianRupee className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1">
                Compare
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-snug max-w-[210px]">
                Check prices, details and connect directly.
              </p>
            </div>

            {/* Step 03 */}
            <div className="relative flex flex-col pl-4 sm:pl-6 lg:border-l lg:border-gray-200">
              <div className="hidden lg:block absolute -left-[5px] top-3.5 w-2 h-2 border-t border-r border-gray-300 bg-white rotate-45" />

              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-300">03</span>
                <MessageSquare className="w-8 h-8 text-gray-900 stroke-[2]" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1">
                Connect
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-snug max-w-[210px]">
                Talk to sellers, negotiate and finalize.
              </p>
            </div>

            {/* Step 04 */}
            <div className="relative flex flex-col pl-4 sm:pl-6 lg:border-l lg:border-gray-200">
              <div className="hidden lg:block absolute -left-[5px] top-3.5 w-2 h-2 border-t border-r border-gray-300 bg-white rotate-45" />

              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-300">04</span>
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1">
                Deal
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-snug max-w-[210px]">
                Close the deal and get to work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR FINANCE SUPPORT */}
      <section className="relative w-full overflow-hidden border-t border-gray-200/70 bg-white px-4 py-9 sm:px-6 sm:py-10">
        <div className="mx-auto mb-6 max-w-7xl">
          <h2 className="text-left text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">{t('home.financeSupportTitle')}</h2>
        </div>

        {financeDisplayItems.length === 0 ? (
          <div className="mx-auto max-w-7xl text-left text-sm text-gray-500">
            {t('home.financeSupportEmpty')}
          </div>
        ) : financeDisplayItems.length === 1 ? (
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-start">
              {renderFinanceCard(financeDisplayItems[0], `single-${financeDisplayItems[0].id}`)}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-7xl overflow-hidden">
            <div className="animate-marquee-left flex w-max items-center gap-4 py-2 will-change-transform">
              <div className="flex shrink-0 items-center gap-4">
                {financeMarqueeItems.map((item, index) =>
                  renderFinanceCard(item, `finance-marquee-${item.id}-${index}`)
                )}
              </div>
              <div className="flex shrink-0 items-center gap-4" aria-hidden="true">
                {financeMarqueeItems.map((item, index) =>
                  renderFinanceCard(item, `finance-marquee-copy-${item.id}-${index}`)
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. LATEST INSIGHTS (latest public listings) */}
      <section className="bg-white px-4 py-8 text-gray-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
              Latest <span className="text-[#D97706]">Insights</span>
            </h2>
            <Link href="/machines" className="group inline-flex shrink-0 items-center gap-2 text-xs font-bold text-gray-900 transition-colors hover:text-amber-600 sm:text-sm">
              <span>View All Machines</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {recentListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {recentListings.slice(0, 3).map((listing) => {
                const imageUrl = getMediaUrl(listing.featuredImage);
                const createdDate = new Date(listing.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <Link key={listing.id} href={generateMachineSlugPath(listing)} className="group flex min-h-[112px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs transition-all hover:border-amber-300 hover:shadow-md">
                    <div className="relative h-auto min-h-[112px] w-[38%] shrink-0 overflow-hidden bg-gray-100">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={listing.title} fill sizes="(max-width: 768px) 38vw, 180px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400"><Package className="h-8 w-8" /></div>
                      )}
                      <span className="absolute left-2 top-2 rounded-full bg-[#FFC107] px-2 py-0.5 text-[9px] font-extrabold uppercase text-black">New</span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                      <p className="mb-1 text-[10px] font-semibold text-gray-500">{listing.categoryName || 'Machine Listing'}</p>
                      <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-gray-900 transition-colors group-hover:text-amber-600">{listing.title}</h3>
                      <p className="mt-2 text-[10px] font-medium text-gray-500">{createdDate}</p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">Read More <ArrowRight size={12} /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">No new listings yet.</div>
          )}
        </div>
      </section>

      {/* 6. FULL WIDTH BOTTOM CTA BANNER SECTION (Matching Image 2) */}
      <section className="relative w-full overflow-hidden bg-gray-950 py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12 text-white">
        {/* Background Image with light readability treatment */}
        <div className="absolute inset-0 z-0">
          {inspectionContent?.imageUrl && !inspectionImageFailed ? (
            <Image
              src={getMediaUrl(inspectionContent.imageUrl) || inspectionContent.imageUrl}
              alt={inspectionContent?.title || 'Bottom CTA banner background'}
              fill
              sizes="100vw"
              className="object-cover"
              onError={() => setInspectionImageFailed(true)}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/24 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12">
          <div className="max-w-2xl">
            {/* Main Punchy Headline (Matching Image 2) */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-3 sm:mb-4 drop-shadow-md">
              {bottomBannerTitleLines.map((line, lineIndex) => {
                const words = line.split(/\s+/).filter(Boolean);
                const shouldAccentLastWord = lineIndex === bottomBannerAccentLineIndex && words.length > 1;
                const baseLine = shouldAccentLastWord ? words.slice(0, -1).join(' ') : line;
                const accentWord = shouldAccentLastWord ? words[words.length - 1] : '';

                return (
                  <React.Fragment key={`${line}-${lineIndex}`}>
                    {lineIndex > 0 ? <br /> : null}
                    {baseLine}
                    {accentWord ? (
                      <>
                        {' '}
                        <span className="text-[#FFC107]">{accentWord}</span>
                      </>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </h2>

            {/* Supporting Description Paragraph */}
            <p className="text-sm sm:text-base text-gray-300 font-medium max-w-xl leading-relaxed mb-6 sm:mb-8 line-clamp-3 whitespace-pre-line">
              {bottomBannerDescription}
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
              <Link
                href="/machines"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFC107] hover:bg-[#FFB300] px-6 sm:px-8 py-3.5 text-sm sm:text-base font-extrabold text-black shadow-md hover:shadow-lg transition-all border border-amber-400 cursor-pointer"
              >
                <span>Browse Machines</span>
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/80 bg-black/40 hover:bg-white/10 px-6 sm:px-8 py-3.5 text-sm sm:text-base font-extrabold text-white backdrop-blur-xs shadow-md transition-all cursor-pointer"
              >
                <span>Contact Us</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
