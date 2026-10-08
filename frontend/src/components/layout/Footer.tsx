'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { SITE_NAME } from '@/lib/site';
import SiteBrand from '@/components/layout/SiteBrand';
import SellVehicleModal from '@/components/sell/SellVehicleModal';
import CustomerPrimePaymentModal from '@/components/payments/CustomerPrimePaymentModal';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { getDialHref, normalizeExternalUrl } from '@/lib/contactLinkUtils.mjs';
import {
  FOOTER_SOCIAL_PLATFORMS,
  getVisibleFooterSocialLinks,
} from '@/lib/footerSocialPlatforms.mjs';
import {
  ChevronRight,
  Globe,
  Heart,
  Phone,
  Mail,
  MapPin,
  Building2
} from 'lucide-react';

type FooterSocialLink = {
  id: string;
  platform: string;
  url: string;
  displayOrder: number;
};

type FooterContact = {
  phoneNumber?: string | null;
  phoneLabel?: string | null;
  emailAddress?: string | null;
  emailLabel?: string | null;
  address?: string | null;
  googleMapsUrl?: string | null;
};

type ResolvedFooterContact = {
  phoneNumber: string;
  phoneLabel: string;
  emailAddress: string;
  emailLabel: string;
  address: string;
  googleMapsUrl: string;
};

type FooterSettingsResponse = {
  success: boolean;
  data?: {
    socialLinks?: FooterSocialLink[];
    contact?: FooterContact;
  };
};

type PublicAccessSettingsResponse = {
  data?: {
    partnerRegistrationEnabled?: boolean;
  };
};

const emptyContact: ResolvedFooterContact = {
  phoneNumber: '',
  phoneLabel: '',
  emailAddress: '',
  emailLabel: '',
  address: '',
  googleMapsUrl: '',
};

const platformLabelMap: Record<string, string> = Object.fromEntries(
  FOOTER_SOCIAL_PLATFORMS.map((platform) => [platform.id, platform.label]),
);

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'FACEBOOK':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>;
    case 'INSTAGRAM':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>;
    case 'TWITTER':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16H20L8.267 4z" /><path d="M4 20l6.768-6.768" /><path d="M13.227 10.773L20 4" /></svg>;
    case 'LINKEDIN':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>;
    case 'YOUTUBE':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>;
    case 'WHATSAPP':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.72 13.06c-.29-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.91 1.13-.17.19-.34.22-.63.08-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.51.15-.17.19-.29.29-.49.1-.19.05-.37-.02-.51-.08-.15-.64-1.54-.87-2.11-.23-.55-.46-.48-.64-.49h-.54c-.19 0-.49.08-.74.37s-.98.96-.98 2.34 1 2.72 1.14 2.91c.15.19 1.97 3 4.88 4.08.69.3 1.23.48 1.65.61.69.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.25.17-1.36-.07-.11-.26-.18-.55-.33" /><path d="M20.52 3.48A11.86 11.86 0 0 0 12.09 0C5.55 0 .23 5.32.23 11.86c0 2.09.55 4.13 1.6 5.93L0 24l6.39-1.68a11.83 11.83 0 0 0 5.7 1.45h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.15-3.44-8.43" /></svg>;
    case 'TELEGRAM':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.7 3.2 2.9 10.45c-1.28.51-1.27 1.22-.23 1.54l4.83 1.51 1.85 5.66c.22.62.11.87.76.87.5 0 .72-.23.99-.5l2.34-2.27 4.87 3.59c.9.5 1.55.24 1.78-.83l3.19-15.06c.34-1.31-.5-1.9-1.58-1.34Zm-2.49 3.65-7.69 6.93-.3 3.21-.74-3.06-4.23-1.32 12.96-5.76Z" /></svg>;
    case 'TIKTOK':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 3c.28 2.02 1.42 3.47 3.5 3.58v3.1a8.17 8.17 0 0 1-3.5-1.02v6.1a5.23 5.23 0 1 1-4.51-5.18v3.2a2.08 2.08 0 1 0 1.4 1.98V3h3.11Z" /></svg>;
    case 'SNAPCHAT':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c-3.04 0-5.08 2.28-5.08 5.18v2.06c0 .58-.18.84-.79 1.1l-1.3.54c-.57.24-.57.74-.04 1.04.54.31 1.18.5 1.9.58.13.02.2.1.16.25-.12.47-.34.91-.67 1.32-.4.5-.98.86-1.75 1.08-.41.12-.48.51-.18.78.48.43 1.2.65 2.12.67.13 0 .22.09.25.23.13.68.48.91 1.14.76.75-.17 1.44-.08 2.07.27.65.36 1.25.93 2.17.93.92 0 1.52-.57 2.17-.93.63-.35 1.32-.44 2.07-.27.66.15 1.01-.08 1.14-.76.03-.14.12-.23.25-.23.92-.02 1.64-.24 2.12-.67.3-.27.23-.66-.18-.78-.77-.22-1.35-.58-1.75-1.08-.33-.41-.55-.85-.67-1.32-.04-.15.03-.23.16-.25.72-.08 1.36-.27 1.9-.58.53-.3.53-.8-.04-1.04l-1.3-.54c-.61-.26-.79-.52-.79-1.1V7.38C17.08 4.48 15.04 2.2 12 2.2Z" /></svg>;
    case 'PINTEREST':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.64 19.31c-.09-1.63-.02-3.59.4-5.15l1.1-4.65s-.28-.56-.28-1.39c0-1.3.76-2.27 1.7-2.27.8 0 1.18.6 1.18 1.32 0 .8-.51 2- .77 3.11-.22.93.47 1.69 1.39 1.69 1.67 0 2.96-1.76 2.96-4.31 0-2.25-1.62-3.83-3.94-3.83-2.69 0-4.27 2.02-4.27 4.1 0 .81.31 1.68.7 2.15.08.1.09.19.07.29l-.26 1.06c-.04.17-.14.2-.32.12-1.19-.55-1.93-2.29-1.93-3.68 0-3 2.18-5.75 6.28-5.75 3.3 0 5.87 2.35 5.87 5.49 0 3.28-2.07 5.92-4.94 5.92-.97 0-1.88-.5-2.2-1.1l-.6 2.3c-.22.85-.81 1.91-1.2 2.56.9.28 1.84.43 2.82.43A10 10 0 0 0 12 2Z" /></svg>;
    case 'REDDIT':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><path d="M8.5 15.1c.98.78 2.14 1.17 3.5 1.17s2.52-.39 3.5-1.17" /><path d="m14.2 7.8.8-2.4 2.25.55" /><circle cx="18.2" cy="6" r="1" /></svg>;
    case 'DISCORD':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.54 5.2A16.1 16.1 0 0 0 15.6 4l-.48.98a14.5 14.5 0 0 0-6.24 0L8.4 4a16.1 16.1 0 0 0-3.94 1.2C2.1 8.25 1.42 11.2 1.76 14.1a15.95 15.95 0 0 0 4.84 2.42l1.17-1.58c-.64-.24-1.25-.54-1.83-.9l.45-.34c3.54 1.64 7.38 1.64 10.88 0l.46.34c-.58.36-1.19.66-1.83.9l1.17 1.58a15.95 15.95 0 0 0 4.84-2.42c.4-3.37-.68-6.3-2.37-8.9ZM8.48 13.12c-1.06 0-1.93-.98-1.93-2.18s.85-2.18 1.93-2.18 1.95.98 1.93 2.18c0 1.2-.85 2.18-1.93 2.18Zm7.04 0c-1.07 0-1.93-.98-1.93-2.18s.85-2.18 1.93-2.18 1.95.98 1.93 2.18c0 1.2-.85 2.18-1.93 2.18Z" /></svg>;
    case 'GITHUB':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.65-.21.65-.46v-1.62c-2.64.57-3.2-1.12-3.2-1.12-.44-1.12-1.08-1.42-1.08-1.42-.88-.6.07-.59.07-.59.97.07 1.48.99 1.48.99.86 1.47 2.25 1.05 2.8.8.09-.62.34-1.05.61-1.29-2.11-.24-4.33-1.05-4.33-4.7 0-1.04.37-1.89.98-2.55-.1-.24-.43-1.21.09-2.52 0 0 .8-.26 2.62.98A9.1 9.1 0 0 1 12 8.92c.81 0 1.63.11 2.4.36 1.82-1.24 2.62-.98 2.62-.98.52 1.31.19 2.28.09 2.52.61.66.98 1.51.98 2.55 0 3.66-2.23 4.46-4.35 4.7.34.29.65.84.65 1.69v2.51c0 .25.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z" /></svg>;
    case 'THREADS':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.8 10.15c-.23-3.18-2.14-5.03-5.53-5.03-3.1 0-5.17 1.43-5.17 3.64 0 2.2 1.86 3.36 5.22 3.36 2.48 0 4.6-.45 5.62-1.22.15.47.23.99.23 1.55 0 2.9-2.05 4.76-5.35 4.76-3.35 0-5.55-1.66-5.55-4.1 0-1.62 1.25-2.8 2.99-2.8 1.96 0 3.12 1.04 3.12 2.47 0 1.22-.83 2.05-2.15 2.05" /><path d="M12.1 2.5c5.46 0 9.4 3.64 9.4 9.5 0 5.52-3.5 9.5-9.5 9.5A9.5 9.5 0 0 1 2.5 12a9.5 9.5 0 0 1 9.6-9.5Z" /></svg>;
    case 'VK':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.9 17.3h1.08s.33-.04.5-.22c.16-.16.16-.47.16-.47s-.02-1.43.64-1.64c.65-.2 1.5 1.39 2.39 2 .68.47 1.2.37 1.2.37l2.4-.03s1.25-.08.66-1.06c-.05-.08-.4-.73-2.05-2.07-1.73-1.41-1.5-1.18.59-3.61 1.27-1.48 1.78-2.38 1.62-2.77-.15-.37-1.1-.27-1.1-.27h-2.7s-.2-.03-.35.06c-.15.09-.24.3-.24.3s-.43 1.15-1 2.13c-1.2 2.08-1.68 2.2-1.87 2.07-.46-.3-.35-1.2-.35-1.85 0-2.01.3-2.85-.58-3.07-.29-.07-.5-.12-1.24-.13-.95-.01-1.75 0-2.2.23-.3.15-.54.49-.4.51.17.02.55.1.75.36.26.35.25 1.14.25 1.14s.15 2.17-.35 2.44c-.35.19-.83-.2-1.86-2.1-.53-.98-.93-2.07-.93-2.07s-.08-.2-.22-.31c-.17-.14-.4-.18-.4-.18H4.75s-.37.01-.5.17c-.12.14-.01.43-.01.43s1.96 4.59 4.18 6.91c2.04 2.13 4.48 1.99 4.48 1.99Z" /></svg>;
    default:
      return <Globe size={16} />;
  }
};

// Roles that are allowed direct SSO handoff to the partner/admin portal
const PORTAL_ALLOWED_ROLES = ['PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'];

export default function Footer() {
  const { t } = useTranslation();
  const { setAuthModalOpen, isAuthenticated, user, token } = useAuthStore();
  
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isPrimePaymentOpen, setIsPrimePaymentOpen] = useState(false);
  const [partnerRegistrationEnabled, setPartnerRegistrationEnabled] = useState(true);
  const [partnerRegistrationSettingsLoaded, setPartnerRegistrationSettingsLoaded] = useState(false);

  // Partner Portal link with SSO token handoff
  // Industry Standard: if the user is already logged in with a portal-eligible role,
  // we forward their JWT via ?token= query param. The admin-portal /login page
  // validates it against /api/auth/profile, saves the session, and redirects
  // the user directly to their role-specific dashboard — no double login needed.
  // Regular customers or unauthenticated users land on the plain login page.
  const handlePartnerPortalClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const partnerPortalUrl =
      process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || 'http://localhost:3001';

    const hasPortalAccess =
      isAuthenticated &&
      token &&
      user?.role &&
      PORTAL_ALLOWED_ROLES.includes(user.role);

    if (hasPortalAccess) {
      // SSO Handoff: pass token so admin-portal can auto-login
      window.open(
        `${partnerPortalUrl}/login?token=${encodeURIComponent(token)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      // Not eligible for SSO: send to plain login page
      window.open(
        `${partnerPortalUrl}/login`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };
  const [socialLinks, setSocialLinks] = useState<FooterSocialLink[]>([]);
  const [contact, setContact] = useState<ResolvedFooterContact>(emptyContact);
  const visibleSocialLinks = getVisibleFooterSocialLinks(socialLinks);

  useEffect(() => {
    let cancelled = false;

    const fetchFooterSettings = async () => {
      try {
        const response = await api.get<FooterSettingsResponse>('/master/footer');
        if (cancelled) {
          return;
        }

        const nextSocialLinks = (response.data.data?.socialLinks || [])
          .map((item) => ({
            ...item,
            platform: (item.platform || 'CUSTOM').toUpperCase(),
            url: normalizeExternalUrl(item.url) || '',
          }))
          .filter((item) => item.url);

        setSocialLinks(nextSocialLinks);
        setContact({
          phoneNumber: (response.data.data?.contact?.phoneNumber || '').trim(),
          phoneLabel: (response.data.data?.contact?.phoneLabel || '').trim(),
          emailAddress: (response.data.data?.contact?.emailAddress || '').trim(),
          emailLabel: (response.data.data?.contact?.emailLabel || '').trim(),
          address: (response.data.data?.contact?.address || '').trim(),
          googleMapsUrl: normalizeExternalUrl(response.data.data?.contact?.googleMapsUrl) || '',
        });
      } catch {
        if (!cancelled) {
          setSocialLinks([]);
          setContact(emptyContact);
        }
      }
    };

    void fetchFooterSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchPublicAccessSettings = async () => {
      try {
        const response = await api.get<PublicAccessSettingsResponse>('/master/public-access');
        if (!cancelled) {
          setPartnerRegistrationEnabled(response.data.data?.partnerRegistrationEnabled !== false);
          setPartnerRegistrationSettingsLoaded(true);
        }
      } catch {
        // Keep the backward-compatible default when the public settings request is unavailable.
        if (!cancelled) {
          setPartnerRegistrationSettingsLoaded(true);
        }
      }
    };

    void fetchPublicAccessSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenSellVehicle = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (user?.role === 'CUSTOMER' && !user?.isPrimeCustomer) {
      try {
        const response = await api.get<{ access?: { gatingEnabled?: boolean; hasActiveSubscription?: boolean } }>(
          '/auth/customer-prime/access',
          { params: { feature: 'SELL_LISTING' } },
        );
        const access = response.data.access;
        if (access?.gatingEnabled && !access.hasActiveSubscription) {
          setIsPrimePaymentOpen(true);
          return;
        }
      } catch {
        // Keep the existing safe default if the access check is temporarily unavailable.
        setIsPrimePaymentOpen(true);
        return;
      }
    }

    setIsSellModalOpen(true);
  };

  const phoneHref = contact.phoneNumber ? getDialHref(contact.phoneNumber) : '';

  return (
    <>
      <footer className="bg-[#1A1A1A] text-gray-300 pt-16 pb-6 px-6 md:px-12 w-full mt-auto border-t border-[#262626]">
        <div className="max-w-[1200px] mx-auto">
          {/* Top Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 sm:gap-x-6 lg:gap-x-0 mb-12 md:mb-16">
            
            {/* Column 1: Brand & Description */}
            <div className="flex flex-col items-start pr-0 lg:pr-8 lg:border-r border-[#333333]">
              <div className="mb-6 relative z-10 w-full max-w-[200px]">
                <SiteBrand variant="footer" align="left" />
              </div>
              <p className="text-sm md:text-[13px] text-[#B3B3B3] leading-relaxed mb-8 max-w-[280px]">
                {t('footer.description', "India's trusted marketplace for buying and selling JCB and heavy construction machines. Verified dealers. Fair prices. Reliable deals.")}
              </p>
              
              {/* Social Icons */}
              <div className="flex flex-wrap items-center gap-3">
                {visibleSocialLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platformLabelMap[String(item.platform || '').toUpperCase()] || String(item.platform || 'Social Link')}
                    className="w-10 h-10 rounded-full border border-[#333333] flex items-center justify-center hover:border-[#F0C85C] hover:text-[#F0C85C] transition-colors"
                  >
                    <SocialIcon platform={String(item.platform || '').toUpperCase()} />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="flex flex-col items-start lg:px-10 lg:border-r border-[#333333]">
              <h4 className="text-white text-[12px] font-bold tracking-[0.05em] uppercase mb-6 flex flex-col">
                {t('footer.quickLinks', 'Quick Links')}
                <span className="w-6 h-[2px] bg-[#F0C85C] mt-3"></span>
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/" className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap">
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    {t('navbar.home')}
                  </Link>
                </li>
                <li>
                  <Link href="/machines" className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap">
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    {t('navbar.machines')}
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleOpenSellVehicle}
                    className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap text-left"
                  >
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    {t('navbar.sellVehicle')}
                  </button>
                </li>
                <li>
                  <Link href="/sold-vehicles" className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap">
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    {t('navbar.soldVehicles')}
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap">
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    Careers &amp; Jobs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Useful Links */}
            <div className="flex flex-col items-start lg:px-10 lg:border-r border-[#333333]">
              <h4 className="text-white text-[12px] font-bold tracking-[0.05em] uppercase mb-6 flex flex-col">
                {t('footer.usefulLinks', 'Useful Links')}
                <span className="w-6 h-[2px] bg-[#F0C85C] mt-3"></span>
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/privacy-policy" className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap">
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    {t('legalPages.privacyPolicy', 'Privacy Policy')}
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap">
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    {t('legalPages.termsAndConditions', 'Terms & Conditions')}
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap">
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    {t('legalPages.disclaimer', 'Disclaimer')}
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us" className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap">
                    <ChevronRight size={14} className="text-[#F0C85C] mr-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    {t('footer.contactUs', 'Contact Us')}
                  </Link>
                </li>
                {partnerRegistrationSettingsLoaded && partnerRegistrationEnabled ? (
                  <li>
                    {/* Partner Portal SSO Link */}
                    <a
                      href={`${process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || 'http://localhost:3001'}/login`}
                      onClick={handlePartnerPortalClick}
                      rel="noopener noreferrer"
                      className="group flex items-center text-[13px] text-[#B3B3B3] hover:text-white transition-colors whitespace-nowrap"
                    >
                      <Building2
                        size={14}
                        className="text-[#F0C85C] mr-3 flex-shrink-0 group-hover:scale-110 transition-transform"
                      />
                      <span>
                        {t('footer.partnerPortal', 'Partner Portal')}
                      </span>
                      {isAuthenticated && user?.role && PORTAL_ALLOWED_ROLES.includes(user.role) && (
                        <span className="ml-2 inline-flex items-center rounded-sm bg-[#F0C85C]/20 border border-[#F0C85C]/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F0C85C] leading-none">
                          SSO
                        </span>
                      )}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div className="flex flex-col items-start lg:pl-10">
              <h4 className="text-white text-[12px] font-bold tracking-[0.05em] uppercase mb-6 flex flex-col">
                {t('footer.contact', 'Contact')}
                <span className="w-6 h-[2px] bg-[#F0C85C] mt-3"></span>
              </h4>
              
              <div className="flex flex-col space-y-5 w-full">
                {/* Phone */}
                {Boolean(contact.phoneNumber) && (
                  <a
                    href={phoneHref || undefined}
                    aria-label={`Call ${contact.phoneNumber}`}
                    className="flex items-start group"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#333333] flex items-center justify-center mr-4 group-hover:border-[#F0C85C] group-hover:bg-[#F0C85C]/10 transition-colors">
                      <Phone size={14} className="text-[#F0C85C]" />
                    </div>
                    <div className="flex flex-col justify-center min-h-[36px]">
                      <span className="text-[13px] text-white font-medium leading-none group-hover:text-[#F0C85C] transition-colors">
                        {contact.phoneNumber}
                      </span>
                      {Boolean(contact.phoneLabel) && (
                        <p className="text-[11px] text-[#8C8C8C] mt-1.5 leading-none">
                          {contact.phoneLabel}
                        </p>
                      )}
                    </div>
                  </a>
                )}

                {/* Email */}
                {Boolean(contact.emailAddress) && (
                  <a
                    href={`mailto:${contact.emailAddress}`}
                    aria-label={`Email ${contact.emailAddress}`}
                    className="flex items-start group"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#333333] flex items-center justify-center mr-4 group-hover:border-[#F0C85C] group-hover:bg-[#F0C85C]/10 transition-colors">
                      <Mail size={14} className="text-[#F0C85C]" />
                    </div>
                    <div className="flex flex-col justify-center min-h-[36px]">
                      <span className="text-[13px] text-white font-medium leading-none group-hover:text-[#F0C85C] transition-colors">
                        {contact.emailAddress}
                      </span>
                      {Boolean(contact.emailLabel) && (
                        <p className="text-[11px] text-[#8C8C8C] mt-1.5 leading-none">
                          {contact.emailLabel}
                        </p>
                      )}
                    </div>
                  </a>
                )}

                {/* Address */}
                {Boolean(contact.address) && (
                  <a
                    href={contact.googleMapsUrl || undefined}
                    target={contact.googleMapsUrl ? '_blank' : undefined}
                    rel={contact.googleMapsUrl ? 'noopener noreferrer' : undefined}
                    aria-label={contact.googleMapsUrl ? 'View office location on Google Maps' : 'Office address'}
                    className={`flex items-start group ${contact.googleMapsUrl ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#333333] flex items-center justify-center mr-4 group-hover:border-[#F0C85C] group-hover:bg-[#F0C85C]/10 transition-colors">
                      <MapPin size={14} className="text-[#F0C85C]" />
                    </div>
                    <div className="flex flex-col justify-center min-h-[36px]">
                      <span className="text-[12px] text-[#8C8C8C] leading-[1.4] pr-2 whitespace-pre-line group-hover:text-white transition-colors">
                        {contact.address}
                      </span>
                    </div>
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-[#333333] flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-[12px] text-[#8C8C8C]">
            
            <div className="flex items-center text-center sm:text-left">
              <span>{t('footer.copyright', `© 2026-2027 ${SITE_NAME}. All rights reserved.`)}</span>
            </div>

            <div className="flex items-center">
              <span className="flex items-center justify-center">
                {t('footer.craftedWith', 'Crafted with')}{' '}
                <Heart size={16} className="mx-1 inline-block fill-red-500 text-red-500" aria-hidden="true" />{' '}
                {t('footer.by', 'by')}{' '}
                <a href="https://webitof.com/" target="_blank" rel="noopener noreferrer" className="ml-1 underline transition-colors hover:text-white">
                  Webitof
                </a>
              </span>
            </div>

          </div>
        </div>
      </footer>

      {isSellModalOpen ? <SellVehicleModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} /> : null}
      {isPrimePaymentOpen ? (
        <CustomerPrimePaymentModal
          isOpen={isPrimePaymentOpen}
          feature="SELL_LISTING"
          onClose={() => setIsPrimePaymentOpen(false)}
          onAccessGranted={() => {
            setIsPrimePaymentOpen(false);
            setIsSellModalOpen(true);
          }}
        />
      ) : null}
    </>
  );
}
