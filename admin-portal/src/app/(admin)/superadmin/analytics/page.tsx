'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, RefreshCw, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import api from '@/lib/api';
import SearchableSelect, { type Option } from '@/components/ui/SearchableSelect';
import BrandLoader from '@/components/ui/BrandLoader';
import { useTranslation } from '@/hooks/useTranslation';
import { buildPaginationItems } from '@/lib/paginationUtils';

type Kpi = { current: number; previous: number; difference: number; percentageChange: number | null; trend: 'up' | 'down' | 'flat' };
type ModelYearRow = { brand: string; model: string; manufacturingYear: number; inventory: number; views: number; leads: number; wonLeads: number; conversionRate: number; demandPerStock: number | null };
type AnalyticsDimensions = { brandId: string; modelId: string; categoryId: string; partnerId: string; countryId: string; stateId: string; cityId: string; manufacturingYear: string; listingStatus: string; leadStatus: string; listingId: string };
type AnalyticsOptions = { brands: Option[]; models: Array<Option & { brandId: string }>; categories: Option[]; partners: Option[]; years: number[]; listings: Option[]; listingStatuses: string[]; leadStatuses: string[]; countries: Array<Option & { emoji?: string | null }> };
type AnalyticsResponse = {
  summary: { liveListings: number; liveInventoryValue: number; trackedViews: Kpi; leads: Kpi; activeLeads: number; wonLeads: number; conversionRate: number; trackedSearches: number; trackedZeroResultSearches: number; soldCount: number; soldValue: number; paymentCount: number; paymentAmount: number; primeSubscriptionCount: number; primeSubscriptionAmount: number; depositCount: number; depositAmount: number };
  listingStatusBreakdown: Array<{ status: string; count: number }>;
  leadStatusBreakdown: Array<{ status: string; count: number }>;
  modelYear: ModelYearRow[];
  topListings: Array<{ id: string; title: string; status: string; price: number; views: number; leads: number; manufacturingYear: number; brand?: { name: string } | null; model?: { name: string } | null; location: string; partner: string; partnerType?: string; isPrime?: boolean }>;
  financialAvailability: Record<string, string>;
  trackingAvailability: { earliestTrackedEventAt: string | null; historicalViewTrend: string; legacyAggregateViews: string };
  reconciliation: { status: string; missingInvoiceNumberSaleRecords: number };
};

const label = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatNumber = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0);
const formatCurrency = (value: number) => `\u20B9${formatNumber(value)}`;
const getInitialDimensions = (params: URLSearchParams): AnalyticsDimensions => ({ brandId: params.get('brandId') || '', modelId: params.get('modelId') || '', categoryId: params.get('categoryId') || '', partnerId: params.get('partnerId') || '', countryId: params.get('countryId') || '', stateId: params.get('stateId') || '', cityId: params.get('cityId') || '', manufacturingYear: params.get('manufacturingYear') || '', listingStatus: params.get('listingStatus') || '', leadStatus: params.get('leadStatus') || '', listingId: params.get('listingId') || '' });
const toAnalyticsParams = (from: string, to: string, dimensions: AnalyticsDimensions) => ({ from, to, ...Object.fromEntries(Object.entries(dimensions).filter(([, value]) => value.trim())) });
const withAllOption = (text: string, options: Option[]) => [{ id: '', name: text }, ...options];

function KpiCard({ title, value, detail, kpi }: { title: string; value: string; detail: string; kpi?: Kpi }) {
  const TrendIcon = kpi?.trend === 'down' ? TrendingDown : TrendingUp;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {kpi && <TrendIcon className={`h-4 w-4 ${kpi.trend === 'down' ? 'text-rose-500' : 'text-emerald-500'}`} />}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1.5 text-xs font-normal text-slate-500">{detail}</p>
      {kpi && (
        <p className="mt-2.5 text-xs font-medium text-slate-600">
          {kpi.percentageChange === null ? 'No comparable prior value' : `${kpi.percentageChange > 0 ? '+' : ''}${kpi.percentageChange}% vs previous period`}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [dimensions, setDimensions] = useState<AnalyticsDimensions>(() => getInitialDimensions(searchParams));
  const [options, setOptions] = useState<AnalyticsOptions | null>(null);
  const [states, setStates] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [isModelYearCollapsed, setIsModelYearCollapsed] = useState(false);
  const [isListingCollapsed, setIsListingCollapsed] = useState(false);
  const [modelYearSearch, setModelYearSearch] = useState('');
  const [listingSearch, setListingSearch] = useState('');

  // Pagination State for Model x Manufacturing Year Table
  const [modelYearPage, setModelYearPage] = useState(1);
  const [modelYearPageSize, setModelYearPageSize] = useState(10);
  const [openModelYearPageSizeDropdown, setOpenModelYearPageSizeDropdown] = useState(false);

  // Pagination State for Listing Performance Table
  const [listingPage, setListingPage] = useState(1);
  const [listingPageSize, setListingPageSize] = useState(10);
  const [openListingPageSizeDropdown, setOpenListingPageSizeDropdown] = useState(false);

  const modelYearRows = data?.modelYear;
  const listingRows = data?.topListings;

  const filteredModelYear = useMemo(() => {
    if (!modelYearRows) return [];
    if (!modelYearSearch.trim()) return modelYearRows;
    const q = modelYearSearch.toLowerCase().trim();
    return modelYearRows.filter((row) =>
      `${row.brand} ${row.model} ${row.manufacturingYear}`.toLowerCase().includes(q)
    );
  }, [modelYearRows, modelYearSearch]);

  const filteredTopListings = useMemo(() => {
    if (!listingRows) return [];
    if (!listingSearch.trim()) return listingRows;
    const q = listingSearch.toLowerCase().trim();
    return listingRows.filter((item) =>
      `${item.title} ${item.partner} ${item.partnerType || ''} ${item.brand?.name || ''} ${item.model?.name || ''} ${item.location || ''} ${item.manufacturingYear}`
        .toLowerCase()
        .includes(q)
    );
  }, [listingRows, listingSearch]);

  // Model Year Pagination Calculations
  const totalModelYearItems = filteredModelYear.length;
  const totalModelYearPages = Math.ceil(totalModelYearItems / modelYearPageSize) || 1;
  const currentModelYearPage = Math.min(modelYearPage, totalModelYearPages);
  const paginatedModelYear = useMemo(() => {
    const start = (currentModelYearPage - 1) * modelYearPageSize;
    return filteredModelYear.slice(start, start + modelYearPageSize);
  }, [filteredModelYear, currentModelYearPage, modelYearPageSize]);
  const modelYearPaginationItems = useMemo(
    () => buildPaginationItems(currentModelYearPage, totalModelYearPages),
    [currentModelYearPage, totalModelYearPages]
  );
  const modelYearStartItem = totalModelYearItems === 0 ? 0 : (currentModelYearPage - 1) * modelYearPageSize + 1;
  const modelYearEndItem = Math.min(currentModelYearPage * modelYearPageSize, totalModelYearItems);

  // Listing Performance Pagination Calculations
  const totalListingItems = filteredTopListings.length;
  const totalListingPages = Math.ceil(totalListingItems / listingPageSize) || 1;
  const currentListingPage = Math.min(listingPage, totalListingPages);
  const paginatedTopListings = useMemo(() => {
    const start = (currentListingPage - 1) * listingPageSize;
    return filteredTopListings.slice(start, start + listingPageSize);
  }, [filteredTopListings, currentListingPage, listingPageSize]);
  const listingPaginationItems = useMemo(
    () => buildPaginationItems(currentListingPage, totalListingPages),
    [currentListingPage, totalListingPages]
  );
  const listingStartItem = totalListingItems === 0 ? 0 : (currentListingPage - 1) * listingPageSize + 1;
  const listingEndItem = Math.min(currentListingPage * listingPageSize, totalListingItems);

  const updateDimension = (key: keyof AnalyticsDimensions, value: string) => setDimensions((current) => ({ ...current, [key]: value }));

  useEffect(() => { let cancelled = false; void api.get<AnalyticsOptions>('/analytics/options').then((response) => { if (!cancelled) { setOptions(response.data); setOptionsError(''); } }).catch(() => { if (!cancelled) setOptionsError('Some filter options could not be loaded from the database.'); }).finally(() => { if (!cancelled) setOptionsLoading(false); }); return () => { cancelled = true; }; }, []);
  useEffect(() => { let cancelled = false; if (!dimensions.countryId) return () => { cancelled = true; }; void api.get<Option[]>(`/locations/states/${dimensions.countryId}`).then((response) => { if (!cancelled) setStates(response.data || []); }).catch(() => { if (!cancelled) setStates([]); }); return () => { cancelled = true; }; }, [dimensions.countryId]);
  useEffect(() => { let cancelled = false; if (!dimensions.stateId) return () => { cancelled = true; }; void api.get<Option[]>(`/locations/cities/${dimensions.stateId}`).then((response) => { if (!cancelled) setCities(response.data || []); }).catch(() => { if (!cancelled) setCities([]); }); return () => { cancelled = true; }; }, [dimensions.stateId]);

  const load = async (nextFrom = from, nextTo = to, nextDimensions = dimensions) => { setLoading(true); setError(''); try { const response = await api.get<AnalyticsResponse>('/analytics/overview', { params: toAnalyticsParams(nextFrom, nextTo, nextDimensions) }); setData(response.data); } catch (requestError) { console.error('Failed to load analytics:', requestError); setError('Analytics could not be loaded. Your existing portal access is unchanged.'); } finally { setLoading(false); } };
  // The initial request intentionally reads the URL once; subsequent refreshes are explicit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = window.setTimeout(() => { void load(searchParams.get('from') || '', searchParams.get('to') || ''); }, 0); return () => window.clearTimeout(timer); }, []);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); router.replace(`${pathname}?${new URLSearchParams(toAnalyticsParams(from, to, dimensions)).toString()}`); void load(from, to, dimensions); };
  const handleReset = () => {
    const emptyDimensions = getInitialDimensions(new URLSearchParams());
    setFrom('');
    setTo('');
    setStates([]);
    setCities([]);
    setDimensions(emptyDimensions);
    setIsFilterCollapsed(true);
    router.replace(pathname);
    void load('', '', emptyDimensions);
  };
  const handleExport = async () => { setExporting(true); setExportError(''); try { const response = await api.get<Blob>('/analytics/export/listings.csv', { params: toAnalyticsParams(from, to, dimensions), responseType: 'blob' }); const url = URL.createObjectURL(response.data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `jcb-analytics-listings-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0); } catch (requestError) { console.error('Failed to export analytics listings:', requestError); setExportError('Listings CSV could not be downloaded. Please try again.'); } finally { setExporting(false); } };

  const listingPath = pathname.startsWith('/employee') ? '/employee/listings' : pathname.startsWith('/admin') ? '/admin/listings' : pathname.startsWith('/partner') ? '/partner/listings' : '/superadmin/listings';
  const analyticsBasePath = pathname.startsWith('/employee') ? '/employee/analytics' : '/superadmin/analytics';
  const brandOptions = withAllOption('All brands', options?.brands || []);
  const modelOptions = withAllOption('All models', options?.models.filter((model) => !dimensions.brandId || model.brandId === dimensions.brandId) || []);
  const countryOptions = withAllOption('All countries', options?.countries.map((country) => ({ id: country.id, name: `${country.emoji || ''} ${country.name}`.trim() })) || []);
  const listingStatusOptions = withAllOption('All listing statuses', options?.listingStatuses.map((status) => ({ id: status, name: label(status) })) || []);
  const availableLeadStatuses = new Set(options?.leadStatuses || []);
  const leadStatusOptions = withAllOption('All lead statuses', [...(availableLeadStatuses.has('NEW') ? [{ id: 'OPEN', name: 'Open' }] : []), ...(availableLeadStatuses.has('CONTACTED') || availableLeadStatuses.has('INTERESTED') || availableLeadStatuses.has('INSPECTION_SCHEDULED') ? [{ id: 'ONGOING', name: 'Ongoing' }] : []), ...(availableLeadStatuses.has('WON') || availableLeadStatuses.has('LOST') ? [{ id: 'CLOSED', name: 'Closed' }] : []), ...(options?.leadStatuses || []).map((status) => ({ id: status, name: label(status) }))]);
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (from) count++;
    if (to) count++;
    count += Object.values(dimensions).filter((v) => Boolean(v?.trim())).length;
    return count;
  }, [from, to, dimensions]);

  return (
    <div className="space-y-3 pb-6">
      {/* Top Header Section with Compact Spacing */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#9a6b00]">
            <BarChart3 className="h-3 w-3" /> Decision workspace
          </div>
          <h1 className="mt-0 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            {t('admin.analyticsTitle', 'Advanced Analytics')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void handleExport()} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-[#f0b900] disabled:opacity-60 transition-colors">
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Preparing CSV...' : 'Export listings'}
          </button>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#f7b500] px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-[#ffc928] transition-colors shadow-2xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        {exportError && <p role="alert" className="text-xs font-semibold text-red-600">{exportError}</p>}
      </div>

      {/* Collapsible Filter Workspace */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition-all">
        {/* Date Row & Collapse Control */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="w-36 sm:w-40">
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:border-[#f7b500] focus:ring-1 focus:ring-[#f7b500] transition-all"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium">to</span>
            <div className="w-36 sm:w-40">
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:border-[#f7b500] focus:ring-1 focus:ring-[#f7b500] transition-all"
              />
            </div>
            <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#f7b500] px-3.5 py-1 text-xs font-semibold text-slate-900 hover:bg-[#ffc928] transition-all shadow-2xs">
              <Search className="h-3.5 w-3.5" /> Apply Dates
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Filter className="h-3.5 w-3.5 text-[#9a6b00]" />
              {isFilterCollapsed ? `Show Filters ${activeFilterCount > 0 ? `(${activeFilterCount})` : ''}` : 'Hide Filters'}
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isFilterCollapsed ? '' : 'rotate-180'}`} />
            </button>
            <button type="button" onClick={handleReset} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors underline decoration-slate-300 underline-offset-4">
              Reset all
            </button>
          </div>
        </div>

        {/* Expanded Dimensional Dropdowns */}
        {!isFilterCollapsed && (
          <div className="mt-2.5 border-t border-slate-100 pt-2.5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {([['brandId', brandOptions], ['modelId', modelOptions], ['categoryId', withAllOption('All categories', options?.categories || [])], ['partnerId', withAllOption('All partners', options?.partners || [])], ['manufacturingYear', withAllOption('All years', options?.years.map((year) => ({ id: year, name: String(year) })) || [])], ['listingStatus', listingStatusOptions], ['leadStatus', leadStatusOptions], ['listingId', withAllOption('All listings', options?.listings || [])]] as Array<[keyof AnalyticsDimensions, Option[]]>).map(([key, selectOptions]) => (
                <div key={key}>
                  <SearchableSelect options={selectOptions} value={dimensions[key]} onChange={(option) => { if (key === 'brandId') setDimensions((current) => ({ ...current, brandId: String(option.id), modelId: '' })); else updateDimension(key, String(option.id)); }} placeholder={optionsLoading ? 'Loading...' : selectOptions[0]?.name || 'Select'} disabled={optionsLoading || (key === 'modelId' && !modelOptions.length)} />
                </div>
              ))}
              <div>
                <SearchableSelect options={countryOptions} value={dimensions.countryId} onChange={(option) => { setStates([]); setCities([]); setDimensions((current) => ({ ...current, countryId: String(option.id), stateId: '', cityId: '' })); }} disabled={optionsLoading} placeholder="All countries" />
              </div>
              <div>
                <SearchableSelect options={[{ id: '', name: 'All states' }, ...states]} value={dimensions.stateId} onChange={(option) => { setCities([]); setDimensions((current) => ({ ...current, stateId: String(option.id), cityId: '' })); }} disabled={!dimensions.countryId || !states.length} placeholder={dimensions.countryId ? (states.length ? 'All states' : 'None') : 'Select country'} />
              </div>
              <div>
                <SearchableSelect options={[{ id: '', name: 'All cities' }, ...cities]} value={dimensions.cityId} onChange={(option) => updateDimension('cityId', String(option.id))} disabled={!dimensions.stateId || !cities.length} placeholder={dimensions.stateId ? (cities.length ? 'All cities' : 'None') : 'Select state'} />
              </div>
            </div>
            {optionsError && <p className="mt-2 text-[11px] font-medium text-amber-600 bg-amber-50 p-2 rounded-lg">{optionsError}</p>}
          </div>
        )}
      </form>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">{error}</div>}
      {loading ? <BrandLoader variant="section" size="md" bg="light" text="Loading analytics workspace..." className="rounded-2xl border border-slate-200 bg-white p-10 shadow-xs" /> : null}

      {!loading && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Live inventory" value={formatNumber(data.summary.liveListings)} detail={`${formatCurrency(data.summary.liveInventoryValue)} asking value`} />
            <KpiCard title="Lead volume" value={formatNumber(data.summary.leads.current)} detail={`${data.summary.activeLeads} active - ${data.summary.wonLeads} won`} kpi={data.summary.leads} />
            <KpiCard title="Completed payments" value={formatCurrency(data.summary.paymentAmount)} detail={`${data.summary.paymentCount} approved/paid remittances`} />
            <KpiCard title="Prime subscriptions" value={formatCurrency(data.summary.primeSubscriptionAmount)} detail={`${data.summary.primeSubscriptionCount} subscription payments`} />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Listing status mix</h2>
            <p className="mt-0.5 text-xs font-normal text-slate-500">Actual records in the selected scope.</p>
            <div className="mt-4 space-y-3">
              {data.listingStatusBreakdown.length ? data.listingStatusBreakdown.map((item) => (
                <div key={item.status}>
                  <div className="mb-1 flex justify-between text-xs font-medium text-slate-700">
                    <span>{label(item.status)}</span>
                    <span className="font-semibold text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#f7b500]" style={{ width: `${Math.min(100, (item.count / Math.max(1, data.summary.liveListings)) * 100)}%` }} />
                  </div>
                </div>
              )) : <p className="py-8 text-center text-xs font-normal text-slate-500">No listing status data.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Model x manufacturing year</h2>
                <p className="mt-0.5 text-xs font-normal text-slate-500">Demand / stock score calculated using cumulative views and period leads.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modelYearSearch}
                    onChange={(e) => {
                      setModelYearSearch(e.target.value);
                      setModelYearPage(1);
                    }}
                    placeholder="Search machines..."
                    className="w-44 sm:w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 text-xs font-normal text-slate-800 outline-none focus:border-[#f7b500] focus:ring-1 focus:ring-[#f7b500] transition-all"
                  />
                  {modelYearSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setModelYearSearch('');
                        setModelYearPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <button onClick={() => setIsModelYearCollapsed(!isModelYearCollapsed)} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors shrink-0">
                  {isModelYearCollapsed ? 'Show Table' : 'Hide Table'}
                </button>
              </div>
            </div>
            
            {!isModelYearCollapsed && (
              <div>
                <div className="overflow-x-auto rounded-t-xl border border-slate-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        {['Machine', 'Year', 'Supply', 'Views', 'Leads', 'Conversion', 'Demand / stock'].map((heading) => (
                          <th key={heading} className="px-4 py-2.5 bg-slate-50 font-semibold text-slate-600">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {paginatedModelYear.map((row) => (
                        <tr key={`${row.brand}-${row.model}-${row.manufacturingYear}`} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-slate-900 block truncate">{row.brand} - {row.model}</span>
                            <p className="text-[11px] font-normal text-slate-500 leading-tight">{row.brand} • Year {row.manufacturingYear}</p>
                          </td>
                          <td className="px-4 py-2.5 font-normal text-slate-600 align-middle">{row.manufacturingYear}</td>
                          <td className="px-4 py-2.5 font-normal text-slate-600 align-middle">{row.inventory}</td>
                          <td className="px-4 py-2.5 font-normal text-slate-600 align-middle">{formatNumber(row.views)}</td>
                          <td className="px-4 py-2.5 font-normal text-slate-600 align-middle">{row.leads}</td>
                          <td className="px-4 py-2.5 font-normal text-slate-600 align-middle">{row.conversionRate}%</td>
                          <td className="px-4 py-2.5 font-semibold text-[#9a6b00] align-middle">{row.demandPerStock ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredModelYear.length === 0 && <p className="px-3 py-8 text-center text-xs font-normal text-slate-500">No matching model-year entries found.</p>}
                </div>

                {/* Model-Year Pagination Footer */}
                {totalModelYearItems > 0 && (
                  <div className="flex flex-col gap-3 border-x border-b border-slate-200 bg-white px-4 py-2.5 rounded-b-xl sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Showing <strong className="font-semibold text-slate-900">{modelYearStartItem}</strong> to <strong className="font-semibold text-slate-900">{modelYearEndItem}</strong> of <strong className="font-semibold text-slate-900">{totalModelYearItems}</strong> entries</span>
                      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                        <span className="text-slate-500">Rows per page:</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenModelYearPageSizeDropdown(!openModelYearPageSizeDropdown)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <span>{modelYearPageSize}</span>
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                          </button>
                          {openModelYearPageSizeDropdown && (
                            <div className="absolute bottom-full left-0 z-20 mb-1 w-16 rounded-lg border border-slate-200 bg-white p-1 shadow-md">
                              {[5, 10, 25, 50].map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    setModelYearPageSize(size);
                                    setModelYearPage(1);
                                    setOpenModelYearPageSizeDropdown(false);
                                  }}
                                  className={`block w-full rounded-md px-2 py-1 text-left text-xs ${modelYearPageSize === size ? 'bg-[#f7b500]/20 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModelYearPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentModelYearPage === 1}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {modelYearPaginationItems.map((item, idx) =>
                          typeof item === 'number' ? (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setModelYearPage(item)}
                              className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${currentModelYearPage === item ? 'bg-[#f7b500] text-slate-950 shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              {item}
                            </button>
                          ) : (
                            <span key={`el-m-${idx}`} className="px-1 text-xs font-bold text-slate-400">...</span>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setModelYearPage((prev) => Math.min(prev + 1, totalModelYearPages))}
                        disabled={currentModelYearPage === totalModelYearPages}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Listing performance</h2>
                <p className="mt-0.5 text-xs font-normal text-slate-500">
                  Active machine listings performance. <Link href={listingPath} className="font-semibold text-[#9a6b00] hover:underline">Open listings</Link>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(e) => {
                      setListingSearch(e.target.value);
                      setListingPage(1);
                    }}
                    placeholder="Search listings..."
                    className="w-44 sm:w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 text-xs font-normal text-slate-800 outline-none focus:border-[#f7b500] focus:ring-1 focus:ring-[#f7b500] transition-all"
                  />
                  {listingSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setListingSearch('');
                        setListingPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <button onClick={() => setIsListingCollapsed(!isListingCollapsed)} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors shrink-0">
                  {isListingCollapsed ? 'Show Table' : 'Hide Table'}
                </button>
              </div>
            </div>
            
            {!isListingCollapsed && (
              <div>
                <div className="overflow-x-auto rounded-t-xl border border-slate-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        {['Listing', 'Partner', 'Type', 'Status', 'Year', 'Views', 'Leads', 'Price'].map((heading) => (
                          <th key={heading} className="px-4 py-2.5 bg-slate-50 font-semibold text-slate-600">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {paginatedTopListings.map((listing) => (
                        <tr key={listing.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <Link href={`${analyticsBasePath}/${listing.id}`} className="font-semibold text-slate-900 hover:text-[#9a6b00] transition-colors truncate block max-w-sm">{listing.title}</Link>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              <p className="text-[11px] font-normal text-slate-500 leading-tight">{listing.brand?.name || '-'} • {listing.model?.name || '-'} • {listing.location || 'Location pending'}</p>
                              <Link href={`${listingPath}/${listing.id}`} className="text-[10px] font-semibold text-[#9a6b00] hover:underline underline-offset-2">Open listing →</Link>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 align-middle">{listing.partner}</td>
                          <td className="px-4 py-2.5 align-middle">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                listing.isPrime || listing.partnerType === 'Prime Customer'
                                  ? 'bg-amber-100 text-amber-950 border-amber-300 font-semibold shadow-2xs'
                                  : listing.partnerType === 'Authorized Place'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : listing.partnerType === 'Broker'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {listing.partnerType || 'Authorized Place'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 align-middle">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">{label(listing.status)}</span>
                          </td>
                          <td className="px-4 py-2.5 font-normal text-slate-600 align-middle">{listing.manufacturingYear}</td>
                          <td className="px-4 py-2.5 font-normal text-slate-600 align-middle">{formatNumber(listing.views)}</td>
                          <td className="px-4 py-2.5 font-normal text-slate-600 align-middle">{listing.leads}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900 align-middle">{formatCurrency(listing.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTopListings.length === 0 && <p className="px-3 py-8 text-center text-xs font-normal text-slate-500">No matching listings found.</p>}
                </div>

                {/* Listing Performance Pagination Footer */}
                {totalListingItems > 0 && (
                  <div className="flex flex-col gap-3 border-x border-b border-slate-200 bg-white px-4 py-2.5 rounded-b-xl sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Showing <strong className="font-semibold text-slate-900">{listingStartItem}</strong> to <strong className="font-semibold text-slate-900">{listingEndItem}</strong> of <strong className="font-semibold text-slate-900">{totalListingItems}</strong> listings</span>
                      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                        <span className="text-slate-500">Rows per page:</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenListingPageSizeDropdown(!openListingPageSizeDropdown)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <span>{listingPageSize}</span>
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                          </button>
                          {openListingPageSizeDropdown && (
                            <div className="absolute bottom-full left-0 z-20 mb-1 w-16 rounded-lg border border-slate-200 bg-white p-1 shadow-md">
                              {[5, 10, 25, 50].map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    setListingPageSize(size);
                                    setListingPage(1);
                                    setOpenListingPageSizeDropdown(false);
                                  }}
                                  className={`block w-full rounded-md px-2 py-1 text-left text-xs ${listingPageSize === size ? 'bg-[#f7b500]/20 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setListingPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentListingPage === 1}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {listingPaginationItems.map((item, idx) =>
                          typeof item === 'number' ? (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setListingPage(item)}
                              className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${currentListingPage === item ? 'bg-[#f7b500] text-slate-950 shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              {item}
                            </button>
                          ) : (
                            <span key={`el-l-${idx}`} className="px-1 text-xs font-bold text-slate-400">...</span>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setListingPage((prev) => Math.min(prev + 1, totalListingPages))}
                        disabled={currentListingPage === totalListingPages}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
