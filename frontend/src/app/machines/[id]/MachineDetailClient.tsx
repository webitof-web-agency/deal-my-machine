"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Award,
  ArrowUpRight,
  Calculator,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cog,
  CreditCard,
  Cpu,
  Fuel,
  GitBranch,
  Globe,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Settings,
  Share2,
  ShieldCheck,
  Truck,
  Zap,
  Play,
  UserCircle,
  X,
  ChevronLeft,
} from 'lucide-react';
import type { MachineListingDetail } from './data';
import { getAbsoluteMediaUrl } from './data';
import api, { API_BASE_URL } from '@/lib/api';
import { calculateMonthlyEmi, rankRelatedListings } from './machineDetailHelpers.mjs';
import { formatPartnerTypeLabel } from '@/lib/partnerType';
import { generateMachineSlugPath } from '@/lib/seoUtils';
import { useAuthStore } from '@/store/authStore';
import CustomerPrimePaymentModal, { type CustomerPrimeFeature } from '@/components/payments/CustomerPrimePaymentModal';
import ListingBuyNowModal from '@/components/payments/ListingBuyNowModal';
import { createPublicContactEnquiry } from '@/lib/enquiries';
import { getPublicAnalyticsIdentity } from '@/lib/analytics';
import { useToastStore } from '@/store/toastStore';
import { useTranslation } from '@/hooks/useTranslation';
import { SITE_NAME } from '@/lib/site';

type MachineDetailClientProps = {
  listing: MachineListingDetail;
};

type RelatedListing = {
  id: string;
  title: string;
  price: number;
  manufacturingYear: number | null;
  operatingHours: number | null;
  locationCity: string | null;
  locationState: string | null;
  status: string;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  featuredImage: string | null;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const getLocationLabel = (listing: MachineListingDetail, fallback: string) =>
  [listing.locationCity, listing.locationState].filter(Boolean).join(', ') || fallback;

const getWhatsappUrl = (phoneNumber?: string | null) => {
  const normalizedDigits = phoneNumber?.replace(/\D/g, '') || '';
  if (!normalizedDigits) {
    return null;
  }

  const fullNumber = normalizedDigits.length === 10 ? `91${normalizedDigits}` : normalizedDigits;
  return `https://wa.me/${fullNumber}`;
};

const getDialNumber = (phoneNumber?: string | null) => {
  const normalizedDigits = phoneNumber?.replace(/\D/g, '') || '';
  if (!normalizedDigits) {
    return '';
  }

  if (normalizedDigits.length === 10) {
    return `+91${normalizedDigits}`;
  }

  return normalizedDigits.startsWith('91') ? `+${normalizedDigits}` : `+${normalizedDigits}`;
};

type ParsedListingDetails = {
  variant: string;
  registrationYear: string;
  registrationNo: string;
  chassisOrSerialNo: string;
  previousOwners: string;
  fuelType: string;
  transmission: string;
  address: string;
  district: string;
  area: string;
  pinCode: string;
  nearbyLandmark: string;
  insuranceExpiry: string;
  rawDescription: string;
  entries: Array<{ key: string; value: string }>;
};

const getAvailabilityBadge = (status: string, labels: { sold: string; reserved: string; available: string }) => {
  const upperStatus = (status || '').toUpperCase();
  if (upperStatus === 'SOLD') {
    return (
      <span className="flex items-center gap-1.5 bg-[#ff3b40] text-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-sm shadow-sm">
        <CheckCircle2 size={12} strokeWidth={3} />
        {labels.sold}
      </span>
    );
  }
  if (upperStatus === 'RESERVED') {
    return <span className="bg-amber-500 text-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded shadow-sm">{labels.reserved}</span>;
  }
  return <span className="bg-green-600 text-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded shadow-sm">{labels.available}</span>;
};

const maskName = (name: string) => {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length <= 3) return trimmed.padEnd(6, '*');
  return `${trimmed.substring(0, 3)}***`;
};

const createEmptyParsedListingDetails = (): ParsedListingDetails => ({
  variant: '',
  registrationYear: '',
  registrationNo: '',
  chassisOrSerialNo: '',
  previousOwners: '',
  fuelType: '',
  transmission: '',
  address: '',
  district: '',
  area: '',
  pinCode: '',
  nearbyLandmark: '',
  insuranceExpiry: '',
  rawDescription: '',
  entries: [],
});

const parseListingDescription = (description?: string | null): ParsedListingDetails => {
  const parsed = createEmptyParsedListingDetails();

  if (!description) {
    return parsed;
  }

  const rawLines: string[] = [];

  for (const line of description.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      rawLines.push('');
      continue;
    }

    const match = trimmed.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      rawLines.push(trimmed);
      continue;
    }

    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    parsed.entries.push({ key: match[1].trim(), value });

    switch (key) {
      case 'variant':
        parsed.variant = value;
        break;
      case 'registration year':
        parsed.registrationYear = value;
        break;
      case 'registration no':
        parsed.registrationNo = value;
        break;
      case 'chassis/serial':
      case 'chassis / serial':
      case 'chassis or serial':
        parsed.chassisOrSerialNo = value;
        break;
      case 'owners':
        parsed.previousOwners = value;
        break;
      case 'fuel':
        parsed.fuelType = value;
        break;
      case 'transmission':
        parsed.transmission = value;
        break;
      case 'address':
        parsed.address = value;
        break;
      case 'district':
        parsed.district = value;
        break;
      case 'area':
        parsed.area = value;
        break;
      case 'pin':
      case 'pin code':
        parsed.pinCode = value;
        break;
      case 'landmark':
        parsed.nearbyLandmark = value;
        break;
      case 'insurance expiry':
        parsed.insuranceExpiry = value;
        break;
      default:
        rawLines.push(trimmed);
        break;
    }
  }

  parsed.rawDescription = rawLines.join('\n');
  return parsed;
};

const getDescriptionParts = (listing: MachineListingDetail) => {
  const parsed = parseListingDescription(listing.description);
  const trimmedRaw = parsed.rawDescription?.trim() || '';
  return {
    overview: trimmedRaw,
    additional: listing.additionalDescription || '',
  };
};

const buildWhatsappMessage = (
  listing: MachineListingDetail,
  locationLabel: string,
  listingUrl: string,
  t: (key: string, params?: Record<string, string | number | boolean | null | undefined>) => string
) => {
  const lines = [
    t('machineDetails.whatsappIntro', { title: listing.title }),
    '',
    `${t('machineDetails.priceLabel')}: ${formatCurrency(listing.price)}`,
    `${t('machineDetails.locationLabel')}: ${locationLabel}`,
    `${t('machineDetails.brandLabel')}: ${listing.brand?.name || t('machineDetails.notSpecified')}`,
    `${t('machineDetails.modelLabel')}: ${listing.model?.name || t('machineDetails.notSpecified')}`,
    `${t('machineDetails.yearLabel')}: ${listing.manufacturingYear ? String(listing.manufacturingYear) : t('machineDetails.notSpecified')}`,
    `${t('machineDetails.listingLabel')}: ${listingUrl}`,
  ];

  return lines.join('\n');
};

export default function MachineDetailClient({ listing }: MachineDetailClientProps) {
  const { t } = useTranslation();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState<'vehicle' | 'location'>('vehicle');

  const [views, setViews] = useState<number>(listing.views || 0);
  const [pendingFeature, setPendingFeature] = useState<CustomerPrimeFeature | null>(null);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [relatedListings, setRelatedListings] = useState<RelatedListing[]>([]);
  const [loanAmount, setLoanAmount] = useState(() => Math.max(0, Math.round((listing.price || 0) * 0.8)));
  const [loanTenure, setLoanTenure] = useState(5);
  const [interestRate, setInterestRate] = useState(10.5);
  const { user, setAuthModalOpen } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailStripRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      thumbnailStripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Only increment view once per load
    const incrementView = async () => {
      try {
        const identity = getPublicAnalyticsIdentity();
        const response = await fetch(`${API_BASE_URL}/master/public-listings/${listing.id}/view`, {
          method: 'POST',
          headers: identity ? { 'Content-Type': 'application/json' } : undefined,
          body: identity ? JSON.stringify(identity) : undefined,
        });
        const data = await response.json();
        if (data.success && data.data?.views) {
          setViews(data.data.views);
        }
      } catch (error) {
        console.error('Failed to increment view', error);
      }
    };
    incrementView();
  }, [listing.id]);

  useEffect(() => {
    let cancelled = false;

    const loadRelatedListings = async () => {
      try {
        const response = await api.get<{ success: boolean; data?: RelatedListing[] }>('/master/public-listings');
        if (cancelled || !response.data?.success) return;

        const candidates = rankRelatedListings(response.data.data || [], listing).slice(0, 3) as RelatedListing[];

        setRelatedListings(candidates);
      } catch {
        if (!cancelled) setRelatedListings([]);
      }
    };

    void loadRelatedListings();
    return () => { cancelled = true; };
  }, [listing, listing.id, listing.category?.id, listing.brand?.id]);

  const images = listing.media.filter((media) => media.type === 'IMAGE');
  
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      if (e.key === 'ArrowRight') setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, images.length]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isLightboxOpen]);

  const videos = listing.media.filter((media) => media.type === 'VIDEO');
  const mainImage = images[activeImageIndex]?.url || listing.featuredImage;
  const partnerTypeLabel = !listing.partner?.partnerType
    ? t('machineDetails.marketplaceSeller')
    : ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'].includes(listing.partner.partnerType)
      ? formatPartnerTypeLabel(listing.partner.partnerType)
    : listing.partner?.partnerType === 'PRIME_CUSTOMER'
      ? t('machineDetails.primeCustomer')
      : listing.partner?.partnerType === 'SHOWROOM' || listing.partner?.partnerType === 'DEALER'
        ? t('machineDetails.verifiedAuthorizedPlace')
        : listing.partner?.partnerType === 'BROKER'
          ? t('machineDetails.verifiedBroker')
          : t('machineDetails.verifiedPartnerLabel', { type: formatPartnerTypeLabel(listing.partner.partnerType, 'Partner') });
  const locationLabel = getLocationLabel(listing, t('machineDetails.locationNotAvailable'));
  const contactNumber = getDialNumber(listing.publicContact?.callNumber);
  const whatsappNumber = listing.publicContact?.whatsappNumber || '';
  const baseWhatsappUrl = getWhatsappUrl(whatsappNumber);
  const parsedDetails = parseListingDescription(listing.description);
  const descriptionParts = getDescriptionParts(listing);

  const listingUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `${API_BASE_URL.replace(/\/api\/?$/, '')}${generateMachineSlugPath(listing)}`;
  const soldPrice = listing.saleRecord?.soldPrice;
  const hasValidSoldPrice = typeof soldPrice === 'number' && Number.isFinite(soldPrice) && soldPrice > 0;
  const hasValidAskingPrice = typeof listing.price === 'number' && Number.isFinite(listing.price) && listing.price > 0;
  const soldPriceLabel = hasValidSoldPrice
    ? formatCurrency(soldPrice)
    : hasValidAskingPrice
      ? formatCurrency(listing.price)
      : t('machineDetails.notSpecified');
  const buyerName = listing.saleRecord?.buyerName?.trim()
    ? maskName(listing.saleRecord.buyerName.trim())
    : '';
  const whatsappMessage = buildWhatsappMessage(listing, locationLabel, listingUrl, t);
  const whatsappUrl = baseWhatsappUrl
    ? `${baseWhatsappUrl}?text=${encodeURIComponent(whatsappMessage)}`
    : null;
  const dealerProfileHref = listing.partner?.id ? `/dealers/${listing.partner.id}` : null;
  const isOwnListing = Boolean(user?.id && listing.partner?.ownerUserId === user.id);
  const emiAmount = calculateMonthlyEmi(loanAmount, interestRate, loanTenure) as number;

  const vehicleSpecItems: SpecItem[] = [
    { icon: <Award className="h-4 w-4" />, label: t('machineDetails.brandLabel'), value: listing.brand?.name || t('machineDetails.na') },
    { icon: <Cpu className="h-4 w-4" />, label: t('machineDetails.modelLabel'), value: listing.model?.name || t('machineDetails.na') },
    { icon: <GitBranch className="h-4 w-4" />, label: t('machineDetails.variantLabel'), value: parsedDetails.variant || t('machineDetails.na') },
    { icon: <Calendar className="h-4 w-4" />, label: t('machineDetails.manufacturingYearLabel'), value: listing.manufacturingYear ? String(listing.manufacturingYear) : t('machineDetails.na') },
    { icon: <Zap className="h-4 w-4" />, label: t('machineDetails.grossPowerLabel'), value: listing.grossPower || t('machineDetails.na') },
    { icon: <Truck className="h-4 w-4" />, label: t('machineDetails.equipmentTypeLabel'), value: listing.category?.name || t('machineDetails.na') },
    { icon: <ShieldCheck className="h-4 w-4" />, label: t('machineDetails.conditionLabel'), value: listing.condition || t('machineDetails.na') },
    { icon: <Clock className="h-4 w-4" />, label: t('machineDetails.operatingHoursLabel'), value: listing.operatingHours ? t('machineDetails.hoursValue', { count: listing.operatingHours }) : t('machineDetails.na') },
    { icon: <Calendar className="h-4 w-4" />, label: t('machineDetails.registrationYearLabel'), value: parsedDetails.registrationYear || t('machineDetails.na') },
    { icon: <Settings className="h-4 w-4" />, label: t('machineDetails.registrationNumberLabel'), value: parsedDetails.registrationNo || t('machineDetails.na') },
    { icon: <Settings className="h-4 w-4" />, label: t('machineDetails.chassisSerialLabel'), value: parsedDetails.chassisOrSerialNo || t('machineDetails.na') },
    { icon: <UserCircle className="h-4 w-4" />, label: t('machineDetails.previousOwnersLabel'), value: parsedDetails.previousOwners || t('machineDetails.na') },
    { icon: <Fuel className="h-4 w-4" />, label: t('machineDetails.fuelTypeLabel'), value: parsedDetails.fuelType || t('machineDetails.na') },
    { icon: <Cog className="h-4 w-4" />, label: t('machineDetails.transmissionLabel'), value: parsedDetails.transmission || t('machineDetails.na') },
  ];

  const locationSpecItems: SpecItem[] = [
    { icon: <MapPin className="h-4 w-4" />, label: t('machineDetails.addressLabel', 'Address'), value: listing.address || parsedDetails.address || t('machineDetails.na') },
    { icon: <Globe className="h-4 w-4" />, label: t('machineDetails.locationLabel'), value: locationLabel },
    { icon: <MapPin className="h-4 w-4" />, label: t('machineDetails.districtLabel'), value: parsedDetails.district || t('machineDetails.na') },
    { icon: <Navigation className="h-4 w-4" />, label: t('machineDetails.areaLabel'), value: parsedDetails.area || t('machineDetails.na') },
    { icon: <Navigation className="h-4 w-4" />, label: t('machineDetails.pinCodeLabel'), value: parsedDetails.pinCode || t('machineDetails.na') },
    { icon: <Navigation className="h-4 w-4" />, label: t('machineDetails.nearbyLandmarkLabel'), value: parsedDetails.nearbyLandmark || t('machineDetails.na') },
    { icon: <Calendar className="h-4 w-4" />, label: t('machineDetails.insuranceExpiryLabel'), value: parsedDetails.insuranceExpiry || t('machineDetails.na') },
  ];

  const knownSpecKeys = new Set([
    'variant', 'registration year', 'registration no', 'chassis/serial', 'chassis / serial', 'chassis or serial',
    'owners', 'fuel', 'transmission', 'address', 'district', 'area', 'pin', 'pin code', 'landmark', 'insurance expiry',
  ]);
  const additionalSpecItems: SpecItem[] = parsedDetails.entries
    .filter(({ key }) => !knownSpecKeys.has(key.toLowerCase()))
    .map(({ key, value }) => ({ icon: <Settings className="h-4 w-4" />, label: key, value }));

  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out ${listing.title} on ${SITE_NAME}`,
          url: window.location.href,
        });
        return;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
          return;
        }
        console.error('Native share failed, falling back to clipboard:', err);
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast({ title: t('machineDetails.linkCopied', 'Link copied to clipboard!'), variant: 'success' });
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  const handleProtectedAction = (feature: CustomerPrimeFeature) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (user.role !== 'CUSTOMER') {
      if (feature === 'CALL' && contactNumber) {
        window.location.href = `tel:${contactNumber}`;
      }

      if (feature === 'WHATSAPP' && whatsappUrl) {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      return;
    }

    setPendingFeature(feature);
  };

  const executeProtectedAction = async (feature: CustomerPrimeFeature) => {
    try {
      if (feature === 'BUY_NOW') {
        setIsBuyNowOpen(true);
        return;
      }

      if (feature === 'CALL' && contactNumber) {
        window.location.href = `tel:${contactNumber}`;
      }

      if (feature === 'WHATSAPP' && whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }

      // Log enquiry asynchronously in background
      void createPublicContactEnquiry({
        listingId: listing.id,
        enquiryType: feature === 'WHATSAPP' ? 'WHATSAPP' : 'CALL',
      }).catch((error) => {
        console.error('Failed to create public contact enquiry', error);
      });
    } catch (error) {
      console.error('Failed to execute protected action', error);
      showToast({
        title: t('dealers.enquiryNotCreated'),
        description: t('dealers.enquiryNotCreatedDescription'),
        variant: 'error',
      });
    } finally {
      setPendingFeature(null);
    }
  };

  const handleBuyNowClick = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (user.role !== 'CUSTOMER') {
      showToast({
        title: 'Customer login required',
        description: 'Buy Now payment is available for customer accounts.',
        variant: 'error',
      });
      return;
    }

    handleProtectedAction('BUY_NOW');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 overflow-x-hidden w-full max-w-[100vw] flex flex-col">
      <div className="w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl py-3 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)] items-center overflow-x-auto whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-gray-500 no-scrollbar">
          <Link href="/" className="flex-shrink-0 transition-colors hover:text-brand-yellow">{t('navbar.home')}</Link>
          <ChevronRight size={14} className="mx-2 flex-shrink-0" />
          <Link href="/machines" className="flex-shrink-0 transition-colors hover:text-brand-yellow">{t('machineDetails.usedEquipment')}</Link>
          <ChevronRight size={14} className="mx-2 flex-shrink-0" />
          <span className="flex-shrink-0">{listing.category?.name || t('machineDetails.machineDetail')}</span>
          <ChevronRight size={14} className="mx-2 flex-shrink-0" />
          <span className="max-w-[220px] flex-shrink-0 truncate font-bold text-gray-900 sm:max-w-none">
            {listing.title}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl py-4 sm:py-8 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)] lg:grid lg:grid-cols-[minmax(0,1.62fr)_minmax(330px,0.78fr)] lg:items-start lg:gap-x-7 lg:gap-y-4">
        <div className="flex flex-col gap-4 sm:gap-6 lg:contents">
          <div className="min-w-0 flex-1 max-w-full">
            <div className="mb-3 sm:mb-4 overflow-hidden rounded-xl border border-gray-200 sm:border-gray-100 bg-white shadow-xs sm:shadow-sm max-w-full">
              <div 
                className="relative aspect-[4/3] bg-gray-100 sm:aspect-[16/10] cursor-pointer group"
                onClick={() => mainImage && setIsLightboxOpen(true)}
              >
                <div className="absolute top-4 left-4 z-10">
                  {getAvailabilityBadge(listing.status, {
                    sold: t('machines.sold'),
                    reserved: t('machines.reserved'),
                    available: t('machines.available'),
                  })}
                </div>

                {videos.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoModalOpen(true);
                    }}
                    className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-xl backdrop-blur-xs transition-all hover:bg-red-700 hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
                    title="Watch Walkaround Video"
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25">
                      <Play size={10} className="fill-white text-white ml-0.5" />
                    </div>
                    <span>Watch Video</span>
                  </button>
                )}
                {mainImage ? (
                  <Image
                    src={getAbsoluteMediaUrl(mainImage)}
                    alt={listing.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Truck size={64} className="text-gray-300" />
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-xs transition-all hover:bg-black/80 hover:scale-110"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-xs transition-all hover:bg-black/80 hover:scale-110"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {images.length > 0 && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm backdrop-blur-sm">
                    <Camera size={14} />
                    <span>{activeImageIndex + 1} / {images.length}</span>
                  </div>
                )}
              </div>

              {(images.length > 1 || videos.length > 0) && (
                <div className="relative border-t border-gray-100 p-2 sm:p-3">
                  <button
                    type="button"
                    onClick={() => scrollThumbnails('left')}
                    className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 shadow-md border border-gray-200 transition-all hover:bg-amber-50 hover:text-black hover:border-amber-300"
                    aria-label="Scroll thumbnails left"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div 
                    ref={thumbnailStripRef}
                    className="flex overflow-x-auto gap-2 sm:gap-3 snap-x [&::-webkit-scrollbar]:hidden w-full scroll-smooth px-7"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative aspect-[4/3] w-[80px] sm:h-20 sm:w-32 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all snap-center ${
                          activeImageIndex === index
                            ? 'border-brand-yellow shadow-xs scale-[0.98]'
                            : 'border-transparent hover:border-gray-200 opacity-90 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={getAbsoluteMediaUrl(image.url)}
                          alt={`${listing.title} ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 25vw, 128px"
                          className="object-cover"
                        />
                      </button>
                    ))}

                    {videos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsVideoModalOpen(true);
                        }}
                        className="relative aspect-[4/3] w-[80px] sm:h-20 sm:w-32 flex-shrink-0 overflow-hidden rounded-lg border-2 border-red-500/80 bg-slate-900 text-white flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.03] shadow-sm group snap-center"
                        title="Watch Machine Video"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 group-hover:bg-red-700 transition-colors shadow-md">
                          <Play size={12} className="fill-white text-white ml-0.5" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-100">Video</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollThumbnails('right')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 shadow-md border border-gray-200 transition-all hover:bg-amber-50 hover:text-black hover:border-amber-300"
                    aria-label="Scroll thumbnails right"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <aside className="w-full min-w-0 lg:col-start-2 lg:row-span-2">
            <div className="rounded-xl border border-gray-200 sm:border-gray-100 bg-white px-4 py-5 sm:p-6 shadow-xs sm:shadow-sm">
              <div className="mb-5">
                <h1 className="mb-2 text-lg sm:text-xl font-bold text-gray-900 leading-snug tracking-tight break-words max-w-full">
                  {listing.title}
                </h1>
                
                <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 font-normal">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400 shrink-0" />
                    <span>
                      {listing.manufacturingYear ? t('machineDetails.modelYearValue', { year: listing.manufacturingYear }) : t('machineDetails.yearNa')}
                    </span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate" title={locationLabel}>{locationLabel}</span>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium tracking-wide text-emerald-700">
                    <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
                    <span className="uppercase">{partnerTypeLabel}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-gray-50/90 to-gray-100/50 border border-gray-200/70 p-4 sm:p-5 mb-6 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">{listing.status === 'SOLD' ? 'Final Sold Price' : 'Asking Price'}</span>
                    {listing.status !== 'SOLD' && views > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 shadow-xs border border-gray-100">
                        {views} {views === 1 ? 'view' : 'views'}
                      </span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-none">
                    {listing.status === 'SOLD' 
                      ? soldPriceLabel
                      : formatCurrency(listing.price || 0)}
                  </div>
                </div>

                {listing.status === 'SOLD' ? (
                  <div className="mb-6 flex flex-col gap-3">
                    <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-50 px-4 py-3.5 font-bold text-gray-600 border border-gray-200 shadow-sm text-center text-[15px]">
                      <CheckCircle2 size={18} className="text-[#137333]" />
                      This equipment is sold out.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mb-6">
                    {isOwnListing ? (
                      <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-900">
                        This is your own listing. You cannot buy your own listing.
                      </div>
                    ) : listing.buyNowPaymentAvailable ? (
                      <button
                        type="button"
                        onClick={handleBuyNowClick}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-black"
                      >
                        <CreditCard size={18} />
                        Buy Now
                      </button>
                    ) : null}

                    {contactNumber ? (
                      <button
                        type="button"
                        onClick={() => handleProtectedAction('CALL')}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFC107] px-4 py-3 font-bold text-black shadow-sm transition-colors hover:bg-[#FFB300]"
                      >
                        <Phone size={18} />
                        {t('machineDetails.callSeller')}
                      </button>
                    ) : (
                      <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 font-bold text-gray-400">
                        <Phone size={18} />
                        {t('dealers.contactUnavailable')}
                      </div>
                    )}

                    {whatsappUrl ? (
                      <button
                        type="button"
                        onClick={() => handleProtectedAction('WHATSAPP')}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#34A853] px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-[#2b8c45]"
                      >
                        <MessageCircle size={18} />
                        {t('machineDetails.chatOnWhatsapp')}
                      </button>
                    ) : null}
                  </div>
                )}

                {listing.partner?.id && 
                 listing.partner?.partnerType !== 'PRIME_CUSTOMER' && 
                 listing.partner?.partnerType !== 'STANDARD_CUSTOMER' ? (
                  <Link
                    href={dealerProfileHref || '#'}
                    className="group block rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:border-amber-400 hover:shadow-md hover:bg-amber-50/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {listing.partner?.logo ? (
                          <div className="relative h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                            <Image
                              src={getAbsoluteMediaUrl(listing.partner.logo)}
                              alt={listing.partner.name || t('machineDetails.dealerLogo')}
                              fill
                              sizes="48px"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold uppercase text-amber-800 border border-amber-200 group-hover:bg-amber-200 transition-colors">
                            {listing.partner?.name?.charAt(0) || t('machineDetails.partnerInitialFallback')}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold text-[#1a202c] truncate group-hover:text-amber-600 transition-colors">
                            {listing.partner?.name || t('machineDetails.verifiedPartner')}
                          </h3>
                          <div className="text-[12px] font-medium text-gray-500">{partnerTypeLabel}</div>
                        </div>
                      </div>

                      <ChevronRight size={18} className="text-gray-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                      {listing.partner?.logo ? (
                        <div className="relative h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                          <Image
                            src={getAbsoluteMediaUrl(listing.partner.logo)}
                            alt={listing.partner.name || t('machineDetails.dealerLogo')}
                            fill
                            sizes="52px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-xl font-bold uppercase text-gray-600">
                          {listing.partner?.name?.charAt(0) || t('machineDetails.partnerInitialFallback')}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="text-[17px] font-bold text-[#1a202c]">
                          {listing.partner?.name || t('machineDetails.verifiedPartner')}
                        </h3>
                        <div className="text-[13px] text-gray-500">{partnerTypeLabel}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchased By Card */}
                {listing.status === 'SOLD' && (
                  <div className="mt-3 rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                        <UserCircle size={24} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Purchased By</div>
                        <h3 className="text-[16px] font-bold text-slate-800 truncate">
                          {buyerName || t('machineDetails.notSpecified')}
                        </h3>
                        {listing.saleRecord && (listing.saleRecord.buyerCity || listing.saleRecord.buyerState) && (
                          <div className="text-[12px] font-medium text-slate-500 mt-0.5">
                            {[listing.saleRecord.buyerCity, listing.saleRecord.buyerState].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center border-t border-gray-100 pt-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={handleShare}
                  className="group flex items-center gap-1.5 text-gray-500 transition-colors hover:text-gray-900"
                >
                  <Share2 size={14} className="transition-transform group-hover:scale-110" />
                  {t('machineDetails.share')}
                </button>
              </div>
            </div>

            <EmiCalculator
              loanAmount={loanAmount}
              loanTenure={loanTenure}
              interestRate={interestRate}
              estimatedEmi={emiAmount}
              maxLoanAmount={Math.max(listing.price || 0, loanAmount, 100000)}
              onLoanAmountChange={setLoanAmount}
              onLoanTenureChange={setLoanTenure}
              onInterestRateChange={setInterestRate}
            />

          </aside>
        </div>

        <div className="w-full min-w-0 lg:col-start-1">
            <section className="mb-6 sm:mb-8">
              <h2 className="mb-4 sm:mb-5 text-xl sm:text-2xl font-bold text-gray-900">{t('machineDetails.keyHighlights')}</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <HighlightCard icon={<Settings className="text-brand-yellow" size={20} />} label={t('machineDetails.conditionLabel')} value={listing.condition || t('machineDetails.na')} />
                <HighlightCard icon={<Zap className="text-brand-yellow" size={20} />} label={t('machineDetails.grossPowerLabel')} value={listing.grossPower || t('machineDetails.na')} />
                <HighlightCard icon={<Clock className="text-brand-yellow" size={20} />} label={t('machineDetails.hoursUsedLabel')} value={listing.operatingHours ? t('machineDetails.hoursValue', { count: listing.operatingHours }) : t('machineDetails.na')} />
                <HighlightCard icon={<MapPin className="text-brand-yellow" size={20} />} label={t('machineDetails.locationLabel')} value={locationLabel} />
              </div>
            </section>

            {(descriptionParts.overview || descriptionParts.additional) && (
              <section className="mb-10">
                <h2 className="mb-5 text-2xl font-bold text-gray-900">{t('machineDetails.overview')}</h2>
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
                  {descriptionParts.overview && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 sm:text-base">
                      {descriptionParts.overview}
                    </p>
                  )}
                  {descriptionParts.additional && (
                    <div className={descriptionParts.overview ? 'mt-8' : ''}>
                      <h3 className="mb-3 text-sm font-bold text-gray-900">{t('machineDetails.additionalDescription')}</h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                        {descriptionParts.additional}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="mb-10">
              <h2 className="mb-5 text-2xl font-bold text-gray-900">{t('machineDetails.technicalSpecifications')}</h2>
              {/* Horizontal Tab Navigation Buttons */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveSpecTab('vehicle')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    activeSpecTab === 'vehicle'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.01]'
                      : 'bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-800 border border-gray-200'
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  <span>{t('machineDetails.vehicleDetails')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSpecTab('location')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    activeSpecTab === 'location'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.01]'
                      : 'bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-800 border border-gray-200'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>{t('machineDetails.registrationLocation')}</span>
                </button>
              </div>

              {/* Active Tab Content Grid */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm transition-all duration-300">
                {activeSpecTab === 'vehicle' ? (
                  <SpecsGrid items={[...vehicleSpecItems, ...additionalSpecItems]} />
                ) : (
                  <SpecsGrid items={locationSpecItems} />
                )}
              </div>
            </section>
        </div>

        {relatedListings.length > 0 ? (
          <section className="lg:col-span-2">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-600">Recommended for you</p>
                <h2 className="text-xl font-black text-gray-900 sm:text-2xl">Similar Machines You May Like</h2>
              </div>
              <Link
                href={listing.category?.id ? `/machines?category=${listing.category.id}` : '/machines'}
                className="hidden items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 sm:inline-flex"
              >
                View All Similar Machines <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedListings.map((relatedListing) => (
                <RelatedMachineCard key={relatedListing.id} listing={relatedListing} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      {pendingFeature ? (
        <CustomerPrimePaymentModal
          isOpen={!!pendingFeature}
          feature={pendingFeature}
          onClose={() => setPendingFeature(null)}
          onAccessGranted={() => {
            void executeProtectedAction(pendingFeature);
          }}
        />
      ) : null}

      <ListingBuyNowModal
        isOpen={isBuyNowOpen}
        listingId={listing.id}
        fallbackTitle={listing.title}
        fallbackAmount={listing.price}
        buyer={user}
        onClose={() => setIsBuyNowOpen(false)}
      />

      {isVideoModalOpen && videos.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 transition-all duration-300"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsVideoModalOpen(false); }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[110] rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors cursor-pointer"
          >
            <X size={28} />
          </button>
          
          <div className="relative h-full w-full max-w-5xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-800">
              <video
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              >
                <source src={getAbsoluteMediaUrl(videos[0].url)} type={videos[0].url.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                Your browser does not support playing this video.
              </video>
            </div>
          </div>
        </div>
      )}

      {isLightboxOpen && mainImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[110] rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X size={28} />
          </button>
          
          <div className="h-full w-full max-h-screen max-w-7xl flex items-center justify-center p-4 sm:p-12 md:p-16" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-full w-full">
              <Image
                src={getAbsoluteMediaUrl(mainImage)}
                alt={listing.title}
                fill
                sizes="100vw"
                className="object-contain"
                quality={100}
                priority
              />
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                }}
                className="absolute left-2 sm:left-8 z-[110] rounded-full bg-black/40 sm:bg-white/10 p-2 sm:p-3 text-white hover:bg-white/20 transition-all backdrop-blur-md sm:hover:scale-110"
              >
                <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-2 sm:right-8 z-[110] rounded-full bg-black/40 sm:bg-white/10 p-2 sm:p-3 text-white hover:bg-white/20 transition-all backdrop-blur-md sm:hover:scale-110"
              >
                <ChevronRight size={24} className="sm:w-8 sm:h-8" />
              </button>
            </>
          )}

          {images.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
              {activeImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmiCalculator({
  loanAmount,
  loanTenure,
  interestRate,
  estimatedEmi,
  maxLoanAmount,
  onLoanAmountChange,
  onLoanTenureChange,
  onInterestRateChange,
}: {
  loanAmount: number;
  loanTenure: number;
  interestRate: number;
  estimatedEmi: number;
  maxLoanAmount: number;
  onLoanAmountChange: (value: number) => void;
  onLoanTenureChange: (value: number) => void;
  onInterestRateChange: (value: number) => void;
}) {
  const [isTenureOpen, setIsTenureOpen] = useState(false);
  const [isInterestOpen, setIsInterestOpen] = useState(false);

  const tenureRef = useRef<HTMLDivElement>(null);
  const interestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tenureRef.current && !tenureRef.current.contains(event.target as Node)) {
        setIsTenureOpen(false);
      }
      if (interestRef.current && !interestRef.current.contains(event.target as Node)) {
        setIsInterestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tenureOptions = [3, 5, 7, 10];
  const interestOptions = [8.5, 10.5, 12.5, 14.5];

  return (
    <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Calculator size={17} />
        </div>
        <h2 className="text-base font-black text-gray-900">EMI Calculator</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
        <div>
          <label htmlFor="machine-loan-amount" className="mb-1.5 block text-xs font-semibold text-gray-500">Loan Amount</label>
          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
            <span className="mr-1 text-sm font-bold text-gray-700">₹</span>
            <input
              id="machine-loan-amount"
              type="number"
              min={0}
              max={maxLoanAmount}
              value={loanAmount}
              onChange={(event) => onLoanAmountChange(Math.min(maxLoanAmount, Math.max(0, Number(event.target.value) || 0)))}
              className="w-full min-w-0 bg-transparent text-sm font-bold text-gray-900 outline-none"
            />
          </div>
          <input
            aria-label="Loan amount slider"
            type="range"
            min={0}
            max={maxLoanAmount}
            step={10000}
            value={Math.min(maxLoanAmount, loanAmount)}
            onChange={(event) => onLoanAmountChange(Number(event.target.value))}
            className="mt-3 w-full accent-[#FFC107]"
          />
        </div>

        <div className="space-y-3">
          {/* Custom Editable & Rounded Dropdown for Tenure */}
          <div className="relative" ref={tenureRef}>
            <label htmlFor="loan-tenure-input" className="block text-xs font-semibold text-gray-500 mb-1.5">
              Tenure
            </label>
            <div className="relative flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
              <input
                id="loan-tenure-input"
                type="number"
                min={1}
                max={30}
                value={loanTenure || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onLoanTenureChange(isNaN(val) ? 0 : val);
                }}
                className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
              />
              <span className="text-xs font-bold text-gray-500 mr-2 shrink-0">Years</span>
              <button
                type="button"
                onClick={() => {
                  setIsTenureOpen(!isTenureOpen);
                  setIsInterestOpen(false);
                }}
                className="p-0.5 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none cursor-pointer"
                aria-label="Toggle tenure menu"
              >
                <ChevronDown size={18} className={`transition-transform duration-200 ${isTenureOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isTenureOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-gray-100 bg-white shadow-xl p-2 space-y-1">
                {tenureOptions.map((years) => {
                  const isSelected = loanTenure === years;
                  return (
                    <button
                      key={years}
                      type="button"
                      onClick={() => {
                        onLoanTenureChange(years);
                        setIsTenureOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-left rounded-xl text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/80 text-gray-900 font-extrabold'
                          : 'text-gray-700 font-semibold hover:bg-gray-50'
                      }`}
                    >
                      <span>{years} Years</span>
                      {isSelected && (
                        <CheckCircle2 size={15} className="text-amber-500 shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Editable & Rounded Dropdown for Interest Rate */}
          <div className="relative" ref={interestRef}>
            <label htmlFor="interest-rate-input" className="block text-xs font-semibold text-gray-500 mb-1.5">
              Interest Rate
            </label>
            <div className="relative flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
              <input
                id="interest-rate-input"
                type="number"
                step="0.1"
                min={0}
                max={50}
                value={interestRate || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onInterestRateChange(isNaN(val) ? 0 : val);
                }}
                className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
              />
              <span className="text-xs font-bold text-gray-500 mr-2 shrink-0">%</span>
              <button
                type="button"
                onClick={() => {
                  setIsInterestOpen(!isInterestOpen);
                  setIsTenureOpen(false);
                }}
                className="p-0.5 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none cursor-pointer"
                aria-label="Toggle interest rate menu"
              >
                <ChevronDown size={18} className={`transition-transform duration-200 ${isInterestOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isInterestOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-gray-100 bg-white shadow-xl p-2 space-y-1">
                {interestOptions.map((rate) => {
                  const isSelected = interestRate === rate;
                  return (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        onInterestRateChange(rate);
                        setIsInterestOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-left rounded-xl text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/80 text-gray-900 font-extrabold'
                          : 'text-gray-700 font-semibold hover:bg-gray-50'
                      }`}
                    >
                      <span>{rate}%</span>
                      {isSelected && (
                        <CheckCircle2 size={15} className="text-amber-500 shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3">
        <p className="text-[10px] font-semibold text-sky-700">Estimated EMI</p>
        <p className="mt-0.5 text-xl font-black tracking-tight text-slate-900">{formatCurrency(estimatedEmi)} <span className="text-xs font-semibold text-slate-500">/ month</span></p>
        <p className="mt-1 text-[10px] text-slate-500">This is an estimate. Actual EMI may vary.</p>
      </div>
    </section>
  );
}

function RelatedMachineCard({ listing }: { listing: RelatedListing }) {
  const location = [listing.locationCity, listing.locationState].filter(Boolean).join(', ') || 'Location not specified';
  const image = listing.featuredImage ? getAbsoluteMediaUrl(listing.featuredImage) : '';
  const isReserved = listing.status.toUpperCase() === 'RESERVED';

  return (
    <Link href={`/machines/${listing.id}`} className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md">
      <div className="relative h-36 overflow-hidden bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400">
            <Truck className="h-8 w-8 opacity-30" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">No image available</span>
          </div>
        )}
        <span className={`absolute right-3 top-3 rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm ${isReserved ? 'bg-amber-500' : 'bg-green-600'}`}>
          {isReserved ? 'Reserved' : 'Available'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-2 text-xs font-black leading-4 text-slate-900 transition-colors group-hover:text-amber-700">{listing.title}</h3>
        <p className="mt-2 text-sm font-black text-[#b48900]">{formatCurrency(listing.price || 0)}</p>
        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate">{location}</span>
        </div>
      </div>
    </Link>
  );
}

function HighlightCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="group flex flex-col rounded-xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm transition-shadow hover:shadow-md min-w-0 h-full">
      <div className="mb-2 sm:mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-yellow-50 transition-colors group-hover:bg-yellow-100 shrink-0">
        {icon}
      </div>
      <span className="mb-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate" title={label}>{label}</span>
      <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words line-clamp-2" title={value}>{value}</span>
    </div>
  );
}

type SpecItem = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function SpecsGrid({ items }: { items: SpecItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-8 lg:gap-x-12 gap-y-2 sm:gap-y-3">
      {items.map(({ icon, label, value }) => (
        <div 
          key={label} 
          className="group flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-200 hover:bg-slate-50 border-b border-gray-100/70 sm:border-b-0"
        >
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100 group-hover:text-amber-700 flex-shrink-0">
              {icon}
            </div>
            <span className="text-sm font-medium text-gray-600 truncate">{label}</span>
          </div>
          <span className="text-sm font-bold text-gray-900 break-words text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}
