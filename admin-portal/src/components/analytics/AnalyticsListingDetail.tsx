'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Tag,
  TrendingUp,
  Users,
  Award,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import BrandLoader from '@/components/ui/BrandLoader';
import { buildPaginationItems } from '@/lib/paginationUtils';

/* ─────────────────────── types ─────────────────────── */
type LeadItem = {
  id: string;
  status: string;
  enquiryType?: string | null;
  createdAt: string;
  updatedAt: string;
};

type SaleRecord = {
  soldPrice: number;
  soldAt: string;
  invoiceNo?: string | null;
};

type AnalyticsListingDetailData = {
  id: string;
  title: string;
  status: string;
  price: number;
  views: number;
  trackedViews: number;
  manufacturingYear: number;
  locationCity?: string | null;
  locationState?: string | null;
  createdAt: string;
  brand?: { name: string } | null;
  model?: { name: string } | null;
  leads: LeadItem[];
  saleRecord: SaleRecord | null;
};

type ApiResponse = {
  listing: AnalyticsListingDetailData;
  availability: {
    uniqueViews: string;
    historicalImpressions: string;
  };
};

/* ─────────────────────── helpers ─────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n || 0);
const fmtCurrency = (n: number) => `₹${fmt(n)}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const LEAD_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NEW:                   { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200' },
  OPEN:                  { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200' },
  CONTACTED:             { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  INTERESTED:            { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200' },
  INSPECTION_SCHEDULED:  { bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-200' },
  WON:                   { bg: 'bg-emerald-50',text: 'text-emerald-800',border: 'border-emerald-200' },
  LOST:                  { bg: 'bg-rose-50',   text: 'text-rose-800',   border: 'border-rose-200' },
};

const LISTING_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PUBLISHED:         { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  DRAFT:             { bg: 'bg-slate-100',  text: 'text-slate-700',   border: 'border-slate-200' },
  PENDING_APPROVAL:  { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200' },
  CHANGES_REQUESTED: { bg: 'bg-orange-50',  text: 'text-orange-800',  border: 'border-orange-200' },
  PAUSED:            { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200' },
  RESERVED:          { bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200' },
  SOLD:              { bg: 'bg-purple-50',  text: 'text-purple-800',  border: 'border-purple-200' },
  REJECTED:          { bg: 'bg-rose-50',    text: 'text-rose-800',    border: 'border-rose-200' },
};

const labelify = (s: string) =>
  s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const statusBadge = (status: string, map: Record<string, { bg: string; text: string; border: string }>) => {
  const c = map[status] ?? { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.bg} ${c.text} ${c.border}`;
};

/* ─────────────────────── KPI card ─────────────────────── */
function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#9a6b00]">
          {icon}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="text-xs font-normal text-slate-500">{sub}</p>}
    </div>
  );
}

/* ─────────────────────── Lead status breakdown ─────────────────────── */
function LeadStatusBreakdown({ leads }: { leads: LeadItem[] }) {
  const total = leads.length;
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const lead of leads) {
      map[lead.status] = (map[lead.status] || 0) + 1;
    }
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [leads]);

  if (!total) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">Lead Status Breakdown</h2>
      <p className="mt-0.5 text-xs text-slate-500">{total} total leads across all statuses</p>
      <div className="mt-4 space-y-3">
        {counts.map(([status, count]) => {
          const colors = LEAD_STATUS_COLORS[status] ?? { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
          const pct = Math.round((count / total) * 100);
          return (
            <div key={status}>
              <div className="mb-1 flex items-center justify-between text-xs font-medium">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text} ${colors.border}`}>
                  {labelify(status)}
                </span>
                <span className="font-semibold text-slate-900">{count} <span className="font-normal text-slate-400">({pct}%)</span></span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[#f7b500] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────── Main component ─────────────────────── */
export default function AnalyticsListingDetail({
  listingId,
  backHref,
}: {
  listingId: string;
  backHref: string;
}) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Preserve analytics filter params for back navigation
  const backUrl = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `${backHref}?${qs}` : backHref;
  }, [backHref, searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get<ApiResponse>(`/analytics/listings/${listingId}`)
      .then((res) => { if (!cancelled) { setData(res.data); } })
      .catch(() => { if (!cancelled) setError('Could not load analytics for this listing. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [listingId]);

  const listing = data?.listing;

  /* ── lead stats ── */
  const totalLeads = listing?.leads.length ?? 0;
  const wonLeads = listing?.leads.filter((l) => l.status === 'WON').length ?? 0;
  const activeLeads = listing?.leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length ?? 0;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';

  /* ── lead pagination ── */
  const totalPages = Math.ceil(totalLeads / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return (listing?.leads ?? []).slice(start, start + PAGE_SIZE);
  }, [listing?.leads, currentPage]);
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, totalPages), [currentPage, totalPages]);
  const leadStart = totalLeads === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const leadEnd = Math.min(currentPage * PAGE_SIZE, totalLeads);

  const listingStatusColors = LISTING_STATUS_COLORS[listing?.status ?? ''] ?? { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <div className="space-y-4 pb-8">
      {/* ── Back + title row ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={backUrl}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-[#f0b900] hover:text-[#9a6b00]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Analytics
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9a6b00]">
            <BarChart3 className="h-3 w-3" />
            Listing Analytics
          </div>
        </div>
        {listing && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f7b500] px-3 py-1 text-xs font-semibold text-slate-950 shadow-2xs transition-colors hover:bg-[#ffc928]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <BrandLoader
          variant="section"
          size="md"
          bg="light"
          text="Loading listing analytics..."
          className="rounded-2xl border border-slate-200 bg-white p-10 shadow-xs"
        />
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Data ── */}
      {!loading && listing && (
        <>
          {/* ── Hero banner ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#2a1f00] to-[#3d2e00] p-6 shadow-lg">
            {/* decorative ring */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full border border-[#f7b500]/10" />
            <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full border border-[#f7b500]/20" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                {/* Status badge */}
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${listingStatusColors.bg} ${listingStatusColors.text} ${listingStatusColors.border}`}>
                  {labelify(listing.status)}
                </span>
                <h1 className="mt-2 text-lg font-bold leading-tight tracking-tight text-white sm:text-xl">
                  {listing.title}
                </h1>
                {/* Brand • Model */}
                {(listing.brand?.name || listing.model?.name) && (
                  <p className="mt-1 text-sm font-medium text-amber-300/80">
                    {[listing.brand?.name, listing.model?.name].filter(Boolean).join(' · ')}
                    {listing.manufacturingYear ? ` · ${listing.manufacturingYear}` : ''}
                  </p>
                )}
                {/* Location + date */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {(listing.locationCity || listing.locationState) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-400/70" />
                      {[listing.locationCity, listing.locationState].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-amber-400/70" />
                    Listed {fmtDate(listing.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-amber-400/70" />
                    ID: <code className="ml-0.5 font-mono text-[10px] text-slate-300">{listing.id}</code>
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="shrink-0 rounded-xl border border-[#f7b500]/20 bg-[#f7b500]/10 px-5 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/70">Asking Price</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-[#f7b500]">
                  {fmtCurrency(listing.price)}
                </p>
              </div>
            </div>
          </div>

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <KpiCard
              icon={<Eye className="h-4 w-4" />}
              label="Views (Legacy)"
              value={fmt(listing.views)}
              sub="Cumulative legacy aggregate"
            />
            <KpiCard
              icon={<BarChart3 className="h-4 w-4" />}
              label="Tracked Views"
              value={fmt(listing.trackedViews)}
              sub="Durable event tracking"
            />
            <KpiCard
              icon={<Users className="h-4 w-4" />}
              label="Total Leads"
              value={fmt(totalLeads)}
              sub={`${activeLeads} active`}
            />
            <KpiCard
              icon={<Award className="h-4 w-4" />}
              label="Won Leads"
              value={fmt(wonLeads)}
              sub="Successful conversions"
            />
            <KpiCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Conversion Rate"
              value={`${conversionRate}%`}
              sub="Won ÷ Total leads"
            />
          </div>

          {/* ── Lead status breakdown ── */}
          <LeadStatusBreakdown leads={listing.leads} />

          {/* ── Lead timeline table ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Lead Timeline</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Most recent {Math.min(totalLeads, 100)} leads for this listing.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {totalLeads} total
              </span>
            </div>

            {totalLeads === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Users className="h-8 w-8 text-slate-200" />
                <p className="text-sm font-medium text-slate-500">No leads yet</p>
                <p className="text-xs text-slate-400">Leads will appear here once buyers enquire about this listing.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-t-xl border border-slate-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        {['Lead ID', 'Status', 'Type', 'Created', 'Last Updated'].map((h) => (
                          <th key={h} className="px-4 py-2.5 font-semibold text-slate-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {paginatedLeads.map((lead) => (
                        <tr key={lead.id} className="transition-colors hover:bg-amber-50/30">
                          <td className="px-4 py-2.5">
                            <code className="font-mono text-[11px] text-slate-500 truncate block max-w-[140px]">{lead.id}</code>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={statusBadge(lead.status, LEAD_STATUS_COLORS)}>
                              {labelify(lead.status)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs font-normal text-slate-600">
                            {lead.enquiryType ? labelify(lead.enquiryType) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-normal text-slate-600 whitespace-nowrap">
                            {fmtDateTime(lead.createdAt)}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-normal text-slate-600 whitespace-nowrap">
                            {fmtDateTime(lead.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalLeads > PAGE_SIZE && (
                  <div className="flex flex-col gap-3 rounded-b-xl border-x border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Showing <strong className="text-slate-900">{leadStart}</strong> to{' '}
                      <strong className="text-slate-900">{leadEnd}</strong> of{' '}
                      <strong className="text-slate-900">{totalLeads}</strong> leads
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Prev
                      </button>
                      {paginationItems.map((item, idx) =>
                        typeof item === 'number' ? (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPage(item)}
                            className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${currentPage === item ? 'bg-[#f7b500] text-slate-950 shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            {item}
                          </button>
                        ) : (
                          <span key={`el-${idx}`} className="px-1 text-xs font-bold text-slate-400">...</span>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Sale record ── */}
          {listing.saleRecord && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-emerald-900">Sale Record</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Sold Price</p>
                  <p className="mt-1 text-xl font-bold text-emerald-900">{fmtCurrency(listing.saleRecord.soldPrice)}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Sold Date</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {fmtDate(listing.saleRecord.soldAt)}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Invoice No.</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {listing.saleRecord.invoiceNo ? (
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {listing.saleRecord.invoiceNo}
                      </span>
                    ) : (
                      <span className="text-emerald-400">—</span>
                    )}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── Data notes ── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
            <strong className="font-semibold text-slate-700">Data note:</strong> Views reflect the legacy cumulative counter.
            Tracked views are recorded via the durable event system and may be lower for older listings. Lead data shows the most recent 100 records.
          </div>
        </>
      )}
    </div>
  );
}
