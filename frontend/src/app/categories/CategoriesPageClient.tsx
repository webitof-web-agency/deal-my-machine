"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  Shapes,
} from 'lucide-react';
import api, { API_ORIGIN } from '@/lib/api';
import CategoryIconRenderer from '@/components/shared/CategoryIconRenderer';

type PublicCategory = {
  id: string;
  name: string;
  count: number;
  featuredImage: string | null;
  icon?: { id: string; name: string; svgData: string } | null;
};

type PublicListing = {
  id: string;
  title: string;
  brand?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  condition?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
};

type HeroSettings = { imageUrl: string | null; headline?: string | null };

const mediaUrl = (url: string | null | undefined) => {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const number = (value: number) => new Intl.NumberFormat('en-IN').format(value);

function CategoryIcon({ category, large = false }: { category: PublicCategory; large?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center justify-center ${large ? 'h-12 w-14' : 'h-10 w-10'} rounded-xl bg-amber-50`}>
      <CategoryIconRenderer
        svgData={category.icon?.svgData}
        name={category.name}
        className={`flex items-center justify-center text-gray-800 ${large ? 'h-8 w-8' : 'h-6 w-6'}`}
      />
      <span className="sr-only">{category.name}</span>
    </div>
  );
}

export default function CategoriesPageClient() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [hero, setHero] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    let cancelled = false;
    const loadPageData = async () => {
      try {
        const [categoriesRes, listingsRes, heroRes] = await Promise.all([
          api.get<{ success: boolean; data: PublicCategory[] }>('/master/public-categories'),
          api.get<{ success: boolean; data: PublicListing[] }>('/master/public-listings'),
          api.get<{ success: boolean; data: HeroSettings }>('/master/hero-image').catch(() => null),
        ]);

        if (cancelled) return;
        if (categoriesRes.data?.success) setCategories(categoriesRes.data.data || []);
        if (listingsRes.data?.success) setListings(listingsRes.data.data || []);
        if (heroRes?.data?.success) setHero(heroRes.data.data || null);
      } catch {
        if (!cancelled) {
          setCategories([]);
          setListings([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPageData();
    return () => { cancelled = true; };
  }, []);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    listings.forEach((listing) => {
      if (listing.brand?.name) counts.set(listing.brand.name, (counts.get(listing.brand.name) || 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [listings]);

  const conditions = useMemo(() => {
    const counts = new Map<string, number>();
    listings.forEach((listing) => {
      const condition = listing.condition || 'Unspecified';
      counts.set(condition, (counts.get(condition) || 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [listings]);

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = categories.filter((category) => {
      const matchesSearch = !query || category.name.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'ALL' || category.id === selectedCategory;
      const matchesBrand = selectedBrands.length === 0 || listings.some((listing) => listing.category?.id === category.id && selectedBrands.includes(listing.brand?.name || ''));
      const matchesCondition = selectedConditions.length === 0 || listings.some((listing) => listing.category?.id === category.id && selectedConditions.includes(listing.condition || 'Unspecified'));
      return matchesSearch && matchesCategory && matchesBrand && matchesCondition;
    });
    return [...result].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : b.count - a.count);
  }, [categories, listings, search, selectedCategory, selectedBrands, selectedConditions, sortBy]);

  const activeFilterCount = selectedBrands.length + selectedConditions.length + (selectedCategory === 'ALL' ? 0 : 1);
  const toggle = (value: string, values: string[], setValues: React.Dispatch<React.SetStateAction<string[]>>) => {
    setValues((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };
  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedBrands([]);
    setSelectedConditions([]);
    setSortBy('popular');
  };
  const heroImage = mediaUrl(hero?.imageUrl);
  const heroHeadlineLines = (hero?.headline || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const heroAccentLineIndex = Math.max(heroHeadlineLines.length - 1, 0);

  return (
    <main className="bg-[#FAFAF9] text-[#071B3A]">
      {false ? (<section className="relative min-h-[560px] overflow-hidden bg-[#1C1C1C] md:h-[600px]">
        {heroImage ? <Image src={heroImage || ''} alt="Heavy machinery marketplace" fill priority sizes="100vw" className="object-cover" /> : null}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1200px] flex-col justify-center px-4 pb-8 pt-24 sm:px-6 md:pb-10 md:pt-20">
          <div className="mb-4 flex items-center gap-2 text-xs text-white/75"><Link href="/">Home</Link><span>›</span><span>Categories</span></div>
          {heroHeadlineLines.length > 0 ? <h1 className="max-w-[700px] text-[30px] font-extrabold leading-[1.08] tracking-normal text-white drop-shadow-lg sm:text-5xl md:text-6xl">{heroHeadlineLines.map((line, index) => { const words = line.split(/\s+/).filter(Boolean); const accentLastWord = index === heroAccentLineIndex && words.length > 1; const baseLine = accentLastWord ? words.slice(0, -1).join(' ') : line; const accentWord = accentLastWord ? words[words.length - 1] : ''; return <React.Fragment key={`${line}-${index}`}>{index > 0 ? <br /> : null}{baseLine}{accentWord ? <> <span className="text-[#FFC107]">{accentWord}</span></> : null}</React.Fragment>; })}</h1> : null}
          <div className="relative z-30 mt-7 w-full max-w-[640px]">
            <div className="flex w-full rounded-md border border-white/30 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
              <div className="flex min-h-[48px] flex-1 items-center rounded-[4px] border border-gray-200 bg-white px-3 focus-within:border-[#FFC107]"><Search className="mr-2.5 h-4 w-4 shrink-0 text-gray-500 sm:h-5 sm:w-5" /><input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories, brands, or machine types..." className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none placeholder:text-gray-500 sm:text-sm" /></div>
              <button type="button" className="ml-2 flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-[#FFC107] px-6 text-sm font-extrabold text-black"><Search className="h-4 w-4" strokeWidth={2.8} />Search</button>
            </div>
          </div>
        </div>
      </section>) : null}

      <section className="mx-auto grid max-w-[1400px] gap-5 px-5 py-5 sm:px-8 lg:grid-cols-[178px_1fr] lg:px-10">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h2 className="text-sm font-extrabold">Filter Categories</h2><Filter className="h-4 w-4 text-slate-500" /></div>
          <button type="button" onClick={() => setSelectedCategory('ALL')} className={`mt-3 flex w-full items-center justify-between rounded-md px-2 py-2 text-xs font-bold ${selectedCategory === 'ALL' ? 'bg-[#FFF3C4] text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}><span className="flex items-center gap-2"><Shapes className="h-4 w-4" />All Categories</span><span>{number(categories.reduce((sum, item) => sum + item.count, 0))}</span></button>
          <div className="mt-2 space-y-1">
            {categories.slice(0, 10).map((category) => <button type="button" key={category.id} onClick={() => setSelectedCategory(category.id)} className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] ${selectedCategory === category.id ? 'bg-amber-50 font-bold text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}><span className="truncate">{category.name}</span><span className="ml-2 text-slate-400">{category.count}</span></button>)}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3"><h3 className="mb-2 text-xs font-extrabold">Condition</h3>{conditions.map((condition) => <label key={condition.name} className="flex cursor-pointer items-center gap-2 py-1 text-[11px] text-slate-600"><input type="checkbox" checked={selectedConditions.includes(condition.name)} onChange={() => toggle(condition.name, selectedConditions, setSelectedConditions)} className="h-3.5 w-3.5 accent-[#FFC107]" /><span className="flex-1">{condition.name}</span><span className="text-slate-400">{condition.count}</span></label>)}</div>
          <div className="mt-4 border-t border-slate-100 pt-3"><h3 className="mb-2 text-xs font-extrabold">Popular Brands</h3>{brands.slice(0, 8).map((brand) => <label key={brand.name} className="flex cursor-pointer items-center gap-2 py-1 text-[11px] text-slate-600"><input type="checkbox" checked={selectedBrands.includes(brand.name)} onChange={() => toggle(brand.name, selectedBrands, setSelectedBrands)} className="h-3.5 w-3.5 accent-[#FFC107]" /><span className="flex-1 truncate">{brand.name}</span><span className="text-slate-400">{brand.count}</span></label>)}</div>
          <button type="button" onClick={resetFilters} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-slate-100 py-2 text-[11px] font-bold text-slate-700 hover:bg-amber-100"><RotateCcw className="h-3.5 w-3.5" />Reset Filters</button>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black">All Categories</h2><p className="text-xs text-slate-500">Explore our complete range of heavy machinery categories</p></div><label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Sort by:<span className="relative"><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-[11px] font-bold outline-none"><option value="popular">Most Popular</option><option value="name">Name</option></select><ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5" /></span></label></div>
          {activeFilterCount > 0 || search ? <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span>{visibleCategories.length} categories found</span><button type="button" onClick={resetFilters} className="font-bold text-amber-700">Clear filters</button></div> : null}
          {loading ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[274px] animate-pulse rounded-lg bg-white" />)}</div> : visibleCategories.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Shapes className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-bold">No categories found</p><button type="button" onClick={resetFilters} className="mt-3 text-xs font-bold text-amber-700">Clear filters</button></div> : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{visibleCategories.map((category) => { const image = mediaUrl(category.featuredImage); return <Link href={`/machines?category=${category.id}`} key={category.id} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"><div className="relative h-28 bg-slate-100">{image ? <Image src={image} alt={`${category.name} heavy equipment`} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><CategoryIcon category={category} large /></div>}</div><div className="p-2.5"><h3 className="truncate text-xs font-black text-slate-900">{category.name}</h3><p className="mt-1 text-[10px] text-slate-500">{number(category.count)} listings</p><p className="mt-1 line-clamp-2 min-h-[28px] text-[10px] leading-4 text-slate-500">Verified machines for construction, material handling and more.</p><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-900"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFC107]"><ArrowRight className="h-3.5 w-3.5" /></span>Explore</span></div></Link>; })}</div>}
        </div>
      </section>
    </main>
  );
}
