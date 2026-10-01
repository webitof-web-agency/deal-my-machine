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
  X,
} from 'lucide-react';
import api, { API_ORIGIN } from '@/lib/api';
import CategoryIconRenderer from '@/components/shared/CategoryIconRenderer';
import { buildCategoryFilterData } from './categoryFilters.mjs';

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

type CategoryFacetOption = { id: string; name: string; count: number };
type ListingFacetOption = { name: string; count: number };
type CategoryFilterData = {
  filteredListings: PublicListing[];
  categoryOptions: CategoryFacetOption[];
  brandOptions: ListingFacetOption[];
  conditionOptions: ListingFacetOption[];
};

const mediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const number = (value: number) => new Intl.NumberFormat('en-IN').format(value);

function CategoryIcon({ category, large = false }: { category: PublicCategory; large?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center justify-center ${large ? 'h-14 w-14' : 'h-10 w-10'} rounded-2xl bg-amber-100/80 text-amber-800 border border-amber-200/60 shadow-xs`}>
      <CategoryIconRenderer
        svgData={category.icon?.svgData}
        name={category.name}
        className={`flex items-center justify-center text-slate-800 ${large ? 'h-9 w-9' : 'h-6 w-6'}`}
      />
      <span className="sr-only">{category.name}</span>
    </div>
  );
}

export default function CategoriesPageClient() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadPageData = async () => {
      try {
        const [categoriesRes, listingsRes] = await Promise.all([
          api.get<{ success: boolean; data: PublicCategory[] }>('/master/public-categories'),
          api.get<{ success: boolean; data: PublicListing[] }>('/master/public-listings'),
        ]);

        if (cancelled) return;
        if (categoriesRes.data?.success) setCategories(categoriesRes.data.data || []);
        if (listingsRes.data?.success) setListings(listingsRes.data.data || []);
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

  const filterData = useMemo(() => buildCategoryFilterData({
    categories,
    listings,
    search,
    selectedCategory,
    selectedBrands,
    selectedConditions,
  }) as CategoryFilterData, [categories, listings, search, selectedCategory, selectedBrands, selectedConditions]);

  const { categoryOptions, brandOptions: brands, conditionOptions: conditions } = filterData;

  const visibleCategories = useMemo(() => {
    const counts = new Map(categoryOptions.map((category) => [category.id, category.count]));
    const result = categories
      .filter((category) => counts.has(category.id))
      .map((category) => ({ ...category, count: counts.get(category.id) || 0 }));
    return [...result].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : b.count - a.count);
  }, [categories, categoryOptions, sortBy]);

  const activeFilterCount = selectedBrands.length + selectedConditions.length + (selectedCategory === 'ALL' ? 0 : 1);
  const visibleListingCount = filterData.filteredListings.length;

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

  const filterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Filter Categories</h2>
        </div>
        {activeFilterCount > 0 || search ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-bold text-amber-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Reset All
          </button>
        ) : null}
      </div>

      {/* Category selector pill list */}
      <div>
        <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Categories</label>
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shapes className="h-4 w-4 shrink-0" />
            <span>All Categories</span>
          </span>
          <span className="rounded-full bg-slate-950/10 px-2 py-0.5 text-[10px] font-extrabold">{number(visibleListingCount)}</span>
        </button>

        <div className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-1 text-xs">
          {categoryOptions.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 font-bold text-amber-900 border border-amber-200/80'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate pr-2">{category.name}</span>
                <span className="shrink-0 text-[11px] font-semibold text-slate-400">{category.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition Filter */}
      {conditions.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-700">Condition</h3>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {conditions.map((condition) => {
              const isChecked = selectedConditions.includes(condition.name);
              return (
                <label key={condition.name} className="flex cursor-pointer items-center justify-between text-xs text-slate-600 hover:text-slate-900">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(condition.name, selectedConditions, setSelectedConditions)}
                      className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500 accent-[#FFC107] cursor-pointer"
                    />
                    <span className="truncate font-medium">{condition.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 ml-2">{condition.count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Brands Filter */}
      {brands.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-700">Popular Brands</h3>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {brands.map((brand) => {
              const isChecked = selectedBrands.includes(brand.name);
              return (
                <label key={brand.name} className="flex cursor-pointer items-center justify-between text-xs text-slate-600 hover:text-slate-900">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(brand.name, selectedBrands, setSelectedBrands)}
                      className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500 accent-[#FFC107] cursor-pointer"
                    />
                    <span className="truncate font-medium">{brand.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 ml-2">{brand.count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={resetFilters}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-amber-100 hover:text-slate-950 transition-colors cursor-pointer"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset Filters</span>
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50/60 text-slate-950 flex flex-col">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent opacity-70"></div>
        <div className="relative max-w-7xl mx-auto space-y-4 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Explore Equipment <span className="text-[#FFC107]">Categories</span>
          </h1>

          {/* Search Input Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md shadow-xl">
              <Search size={18} className="absolute left-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category, brand, or machine type..."
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full flex-grow">
        {/* Mobile Filter Drawer Button */}
        <div className="mb-5 flex items-center justify-between lg:hidden bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-slate-800 cursor-pointer"
          >
            <Filter className="h-4 w-4 text-amber-400" />
            <span>Filter Categories</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">
                {activeFilterCount}
              </span>
            )}
          </button>

          <span className="text-xs font-bold text-slate-600">
            {visibleCategories.length} Categories
          </span>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:block sticky top-24">
            {filterPanel}
          </aside>

          {/* Mobile Filter Drawer Modal */}
          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
                onClick={() => setIsMobileFiltersOpen(false)}
              />
              <aside className="relative z-10 h-full w-[min(88vw,340px)] overflow-y-auto bg-white p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">Filter Options</h3>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {filterPanel}
              </aside>
            </div>
          )}

          {/* Main Grid Section */}
          <div className="min-w-0 space-y-6">
            {/* Header & Sort Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                  All Equipment Categories
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Browse complete collection of construction and heavy machinery listings
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                <span className="text-xs font-semibold text-slate-500">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3.5 pr-8 text-xs font-extrabold text-slate-900 outline-none hover:border-slate-300 focus:border-amber-400 cursor-pointer"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="name">Alphabetical (A-Z)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Active Filters Bar */}
            {(activeFilterCount > 0 || search) && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50/70 border border-amber-200/70 px-4 py-2.5 text-xs text-amber-900">
                <span className="font-semibold">
                  Showing {visibleCategories.length} categories matching your filters
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-extrabold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Skeleton Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-64 animate-pulse rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3">
                    <div className="h-32 bg-slate-100 rounded-xl"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : visibleCategories.length === 0 ? (
              /* Empty State */
              <div className="rounded-2xl border border-slate-200/80 bg-white p-10 sm:p-14 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 ring-4 ring-amber-50/50">
                  <Shapes className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Categories Found</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  We couldn&apos;t find any category matching your current search parameters. Try clearing your filters or search term.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl hover:bg-amber-600 transition-all shadow-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Category Cards Grid */
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6">
                {visibleCategories.map((category) => {
                  const image = mediaUrl(category.featuredImage);
                  return (
                    <Link
                      href={`/machines?category=${category.id}`}
                      key={category.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-md"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        {image ? (
                          <Image
                            src={image}
                            alt={`${category.name} heavy equipment`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-100">
                            <CategoryIcon category={category} large />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 rounded-full bg-slate-950/75 px-3 py-1 text-[11px] font-extrabold text-white backdrop-blur-xs shadow-xs">
                          {number(category.count)} listings
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4 sm:p-5">
                        <h3 className="truncate text-base font-extrabold text-slate-950 group-hover:text-amber-600 transition-colors">
                          {category.name}
                        </h3>

                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 min-h-[36px]">
                          Verified machines for construction, material handling and heavy equipment mobility.
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-slate-900 group-hover:text-amber-600">
                          <span>Explore Category</span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400 group-hover:bg-amber-500 text-slate-950 transition-all group-hover:translate-x-0.5 shadow-xs">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
