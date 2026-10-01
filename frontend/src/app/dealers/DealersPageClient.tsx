"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Building2,
  Check,
  ChevronDown,
  Layers,
  MapPin,
  Menu,
  Phone,
  Search,
  SlidersHorizontal,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { formatPartnerTypeLabel } from '@/lib/partnerType';
import { createPublicContactEnquiry } from '@/lib/enquiries';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import CustomerPrimePaymentModal from '@/components/payments/CustomerPrimePaymentModal';
import { getAbsoluteFileUrl } from '@/lib/fileUpload';
import { useTranslation } from '@/hooks/useTranslation';
import { generateDealerSlugPath } from '@/lib/seoUtils';
import BrandLoader from '@/components/ui/BrandLoader';
import { buildDealerFilterData, getDealerFacetValues } from './dealerFilters.mjs';

interface Dealer {
  id: string;
  userId?: string | null;
  businessName: string | null;
  businessLogoUrl: string | null;
  district: string | null;
  businessAddress: string | null;
  alternateMobile: string | null;
  user: {
    mobile: string | null;
    name: string | null;
  } | null;
  partnerType: string | null;
  workingHours: string | null;
  businessDescription: string | null;
  contactPreference: string | null;
  yearsInBusiness: number | null;
  categories?: string[];
  serviceAreas?: string | null;
  publicContact: {
    callNumber: string | null;
    whatsappNumber: string | null;
    routingMode: 'SUPER_ADMIN' | 'SELLER';
    fallbackApplied: boolean;
  };
}

type FacetOption = { name: string; count: number };

type DealerFilterData = {
  filteredDealers: Dealer[];
  locationOptions: FacetOption[];
  dealerTypeOptions: FacetOption[];
  categoryOptions: FacetOption[];
  serviceOptions: FacetOption[];
  allLocations: string[];
};

type FacetSectionProps = {
  title: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
};

type StyledDropdownOption = {
  value: string;
  label: string;
};

type StyledDropdownProps = {
  value: string;
  placeholder: string;
  options: StyledDropdownOption[];
  onChange: (value: string) => void;
  icon: LucideIcon;
  className?: string;
};

const StyledDropdown = ({ value, placeholder, options, onChange, icon: Icon, className = '' }: StyledDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
      >
        <Icon className="h-5 w-5 shrink-0 text-slate-800" />
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? 'font-medium' : 'text-slate-500'}`}>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)]">
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${!value ? 'bg-amber-50/80 font-bold text-gray-950' : 'font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <span className="text-[13px]">{placeholder}</span>
              {!value ? <Check className="h-4 w-4 shrink-0 text-[#E5A700] stroke-[2.5]" /> : null}
            </button>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange(option.value); setIsOpen(false); }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${isSelected ? 'bg-amber-50/80 font-bold text-gray-950' : 'font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <span className="text-[13px]">{option.label}</span>
                  {isSelected ? <Check className="h-4 w-4 shrink-0 text-[#E5A700] stroke-[2.5]" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FacetSection = ({ title, options, selected, onToggle }: FacetSectionProps) => {
  if (options.length === 0) return null;

  return (
    <section className="border-t border-slate-200 pt-5">
      <h3 className="mb-3 text-sm font-extrabold tracking-wide text-slate-900">{title}</h3>
      <div className="space-y-2.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.name);
          return (
            <label key={option.name} className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(option.name)}
                className="peer sr-only"
              />
              <span className={`flex h-4 w-4 items-center justify-center rounded border transition ${isSelected ? 'border-[#FFC107] bg-[#FFC107] text-slate-950' : 'border-slate-300 bg-white'}`}>
                {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.name}</span>
              <span className="text-xs font-semibold text-slate-400">{option.count}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
};

const normalizeDialNumber = (value?: string | null) => {
  const digits = value?.replace(/\D/g, '') || '';
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  return digits.startsWith('91') ? `+${digits}` : `+${digits}`;
};

export default function DealersPageClient() {
  const { t } = useTranslation();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedDealerTypes, setSelectedDealerTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'location'>('name');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDealerContact, setSelectedDealerContact] = useState<{
    callNumber: string;
    partnerProfileId: string;
  } | null>(null);
  const { user, setAuthModalOpen } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const response = await api.get('/master/dealers');
        if (response.data.success) setDealers(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dealers:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchDealers();
  }, []);

  const filterData = useMemo(() => buildDealerFilterData({
    dealers,
    search: locationQuery,
    selectedLocation: locationQuery,
    selectedDealerTypes,
    selectedCategories,
    selectedServices,
  }) as DealerFilterData, [dealers, locationQuery, selectedDealerTypes, selectedCategories, selectedServices]);

  const visibleDealers = useMemo(() => [...filterData.filteredDealers].sort((left, right) => {
    if (sortBy === 'location') {
      return `${left.district || ''}${left.businessAddress || ''}`.localeCompare(`${right.district || ''}${right.businessAddress || ''}`);
    }
    return (left.businessName || '').localeCompare(right.businessName || '');
  }), [filterData.filteredDealers, sortBy]);

  const toggleValue = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const clearFilters = () => {
    setLocationQuery('');
    setSelectedDealerTypes([]);
    setSelectedCategories([]);
    setSelectedServices([]);
  };

  const handleDealerCall = async (callNumber: string, partnerProfileId: string) => {
    try {
      await createPublicContactEnquiry({ partnerProfileId, enquiryType: 'CALL' });
      window.location.href = `tel:${callNumber}`;
    } catch (error) {
      console.error('Failed to create dealer enquiry:', error);
      showToast({
        title: t('dealers.enquiryNotCreated'),
        description: t('dealers.enquiryNotCreatedDescription'),
        variant: 'error',
      });
    } finally {
      setSelectedDealerContact(null);
    }
  };

  const filterPanel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-900" />
          <h2 className="text-lg font-extrabold text-slate-950">Filters</h2>
        </div>
        <button type="button" onClick={clearFilters} className="text-xs font-bold text-[#C88700] hover:text-slate-950">Clear All</button>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <label className="mb-2 block text-sm font-extrabold text-slate-900" htmlFor="dealer-location-filter">Location</label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="dealer-location-filter"
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
            placeholder="Enter city or district"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
          />
        </div>
      </div>

      <FacetSection title="Dealer Type" options={filterData.dealerTypeOptions.map((option: FacetOption) => ({ ...option, name: formatPartnerTypeLabel(option.name) }))} selected={selectedDealerTypes.map((value) => formatPartnerTypeLabel(value))} onToggle={(label) => {
        const option = filterData.dealerTypeOptions.find((item: FacetOption) => formatPartnerTypeLabel(item.name) === label);
        if (option) toggleValue(setSelectedDealerTypes, option.name);
      }} />
      <FacetSection title="Categories" options={filterData.categoryOptions} selected={selectedCategories} onToggle={(value) => toggleValue(setSelectedCategories, value)} />
      <FacetSection title="Services Offered" options={filterData.serviceOptions} selected={selectedServices} onToggle={(value) => toggleValue(setSelectedServices, value)} />
    </div>
  );

  return (
    <>
      <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
        <section className="relative overflow-visible bg-slate-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: "url('/images/jcbhero.png')" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/35" />
          <div className="relative mx-auto max-w-[1440px] px-5 pb-8 pt-7 sm:px-8 lg:px-12 lg:pb-10 lg:pt-9">
            <div className="mb-12 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Link href="/" className="hover:text-white">Home</Link>
              <span className="text-slate-500">›</span>
              <span className="text-white">Find Dealer</span>
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Discover Authorized <span className="text-[#FFC107]">Dealers</span> Across India
            </h1>

            <div className="mt-9 grid gap-3 rounded-2xl bg-white p-3 shadow-2xl lg:grid-cols-[1.45fr_1fr_1.25fr_auto]">
              <label className="relative flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3">
                <MapPin className="mr-3 h-5 w-5 shrink-0 text-slate-800" />
                <input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Enter your city, state or pincode" className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" />
              </label>
              <StyledDropdown
                value={selectedCategories[0] || ''}
                placeholder="Select Category"
                icon={Layers}
                options={filterData.categoryOptions.map((option: FacetOption) => ({ value: option.name, label: option.name }))}
                onChange={(value) => setSelectedCategories(value ? [value] : [])}
              />
              <StyledDropdown
                value={selectedDealerTypes[0] || ''}
                placeholder="Dealer Type"
                icon={Building2}
                options={filterData.dealerTypeOptions.map((option: FacetOption) => ({ value: option.name, label: formatPartnerTypeLabel(option.name) }))}
                onChange={(value) => setSelectedDealerTypes(value ? [value] : [])}
              />
              <button type="button" onClick={() => document.getElementById('dealer-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="inline-flex w-full lg:w-auto items-center justify-center gap-2 rounded-xl bg-[#FFC107] px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-[#ffca28] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer">
                <Search className="h-5 w-5" />
                Search Dealers
              </button>
            </div>
          </div>
        </section>

        <section id="dealer-results" className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm">
              <Menu className="h-4 w-4" /> Filters
            </button>
            <span className="text-sm font-semibold text-slate-500">{visibleDealers.length} found</span>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[235px_minmax(0,1fr)]">
            <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">{filterPanel}</aside>

            {filtersOpen ? (
              <div className="fixed inset-0 z-50 flex lg:hidden">
                <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-slate-950/50" />
                <aside className="relative z-10 h-full w-[min(88vw,360px)] overflow-y-auto bg-white p-5 shadow-2xl">
                  <div className="mb-5 flex justify-end"><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X className="h-6 w-6 text-slate-700" /></button></div>
                  {filterPanel}
                </aside>
              </div>
            ) : null}

            <div>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-black text-slate-950">{visibleDealers.length} Dealers Found</p>
                  <p className="mt-1 text-sm text-slate-500">Verified partners available on {locationQuery || 'DealMyMachine'}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  Sort by:
                  <span className="relative">
                    <StyledDropdown
                      value={sortBy}
                      placeholder="Sort"
                      icon={SlidersHorizontal}
                      className="min-w-[170px]"
                      options={[{ value: 'name', label: 'Business Name' }, { value: 'location', label: 'Location' }]}
                      onChange={(value) => setSortBy((value || 'name') as 'name' | 'location')}
                    />
                  </span>
                </label>
              </div>

              {loading ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white"><BrandLoader size="md" variant="section" bg="light" /></div>
              ) : visibleDealers.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm">
                  <Building2 className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                  <h3 className="text-xl font-bold text-slate-900">{t('dealers.noDealersFound')}</h3>
                  <p className="mt-2 text-sm text-slate-500">Try clearing one or more filters.</p>
                  <button type="button" onClick={clearFilters} className="mt-5 rounded-lg bg-[#FFC107] px-4 py-2 text-sm font-bold text-slate-950">Clear filters</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleDealers.map((dealer) => {
                    const visibleCallNumber = normalizeDialNumber(dealer.publicContact?.callNumber);
                    const dealerHref = generateDealerSlugPath(dealer);
                    const services: string[] = getDealerFacetValues(dealer, 'services');

                    return (
                      <article key={dealer.id} className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[#FFC107] hover:shadow-md sm:p-4">
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <Link href={dealerHref} className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-[150px] sm:w-[165px]">
                            {dealer.businessLogoUrl ? <Image src={getAbsoluteFileUrl(dealer.businessLogoUrl)} alt={dealer.businessName ? `${dealer.businessName} dealer logo` : 'Dealer logo'} fill sizes="165px" className="object-cover transition duration-500 group-hover:scale-105" /> : <Building2 className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <Link href={dealerHref} className="text-lg font-extrabold text-slate-950 transition hover:text-[#C88700]">{dealer.businessName || 'Unnamed Dealer'}</Link>
                                {dealer.partnerType ? <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FFF4CC] px-2 py-1 text-[11px] font-bold text-[#9a6500]"><Award className="h-3 w-3" />{formatPartnerTypeLabel(dealer.partnerType)}</span> : null}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0 text-slate-800" />{[dealer.district, dealer.businessAddress].filter(Boolean).join(', ') || 'Location not provided'}</div>
                            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                              {(dealer.categories || []).map((category) => <span key={category} className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{category}</span>)}
                              {services.map((service) => <span key={service} className="inline-flex items-center gap-1"><Wrench className="h-3.5 w-3.5" />{service}</span>)}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Link href={dealerHref} className="inline-flex flex-1 sm:flex-initial items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 text-center">View Details <span className="ml-1">→</span></Link>
                              {visibleCallNumber ? <button type="button" onClick={() => {
                                if (!user) { setAuthModalOpen(true); return; }
                                if (user.role === 'CUSTOMER') {
                                  setSelectedDealerContact({ callNumber: visibleCallNumber, partnerProfileId: dealer.id });
                                  return;
                                }
                                window.location.href = `tel:${visibleCallNumber}`;
                              }} className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg border border-[#FFC107] bg-white px-4 py-2.5 text-xs font-bold text-slate-900 transition hover:bg-[#FFF8DD] cursor-pointer"><Phone className="h-3.5 w-3.5" /> {t('dealers.call')}</button> : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </section>
      </main>

      {selectedDealerContact ? <CustomerPrimePaymentModal isOpen={!!selectedDealerContact} feature="CALL" onClose={() => setSelectedDealerContact(null)} onAccessGranted={() => {
        if (selectedDealerContact) void handleDealerCall(selectedDealerContact.callNumber, selectedDealerContact.partnerProfileId);
      }} /> : null}
    </>
  );
}
