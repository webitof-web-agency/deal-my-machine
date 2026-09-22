'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Globe, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import api from '@/lib/api';
import { SITE_NAME } from '@/lib/site';

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
};

type FooterSettingsResponse = {
  success: boolean;
  data?: {
    socialLinks?: FooterSocialLink[];
    contact?: FooterContact;
  };
};

type ResolvedContact = {
  phoneNumber: string;
  phoneLabel: string;
  emailAddress: string;
  emailLabel: string;
  address: string;
};

const emptyContact: ResolvedContact = {
  phoneNumber: '',
  phoneLabel: '',
  emailAddress: '',
  emailLabel: '',
  address: '',
};

const normalizeExternalUrl = (value?: string | null) => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return '';

  const candidateValue = /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;

  try {
    const parsedUrl = new URL(candidateValue);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.toString() : '';
  } catch {
    return '';
  }
};

const getDialHref = (phoneNumber: string) => {
  const digits = phoneNumber.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
};

const getPlatformLabel = (platform: string) => {
  const normalized = platform.toUpperCase();
  if (normalized === 'TWITTER') return 'X';
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

export default function ContactUsPageClient() {
  const [contact, setContact] = React.useState<ResolvedContact>(emptyContact);
  const [socialLinks, setSocialLinks] = React.useState<FooterSocialLink[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const fetchContact = async () => {
      try {
        const response = await api.get<FooterSettingsResponse>('/master/footer');
        if (cancelled) return;

        const footerContact = response.data.data?.contact;
        const nextSocialLinks = (response.data.data?.socialLinks || [])
          .map((item) => ({
            ...item,
            platform: String(item.platform || 'CUSTOM').toUpperCase(),
            url: normalizeExternalUrl(item.url),
          }))
          .filter((item) => item.url)
          .sort((left, right) => left.displayOrder - right.displayOrder);

        setContact({
          phoneNumber: (footerContact?.phoneNumber || '').trim(),
          phoneLabel: (footerContact?.phoneLabel || '').trim(),
          emailAddress: (footerContact?.emailAddress || '').trim(),
          emailLabel: (footerContact?.emailLabel || '').trim(),
          address: (footerContact?.address || '').trim(),
        });
        setSocialLinks(nextSocialLinks);
      } catch {
        if (!cancelled) {
          setContact(emptyContact);
          setSocialLinks([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchContact();

    return () => {
      cancelled = true;
    };
  }, []);

  const contactOwner = contact.emailLabel || contact.phoneLabel || `${SITE_NAME} Support Team`;
  const hasContact = Boolean(contact.phoneNumber || contact.emailAddress || contact.address);
  const phoneHref = contact.phoneNumber ? getDialHref(contact.phoneNumber) : '';

  return (
    <main className="bg-[#FAF8F5] text-gray-900">
      <section className="relative overflow-hidden bg-[#111111] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,193,7,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-[#FFC107]">
            Contact Support
          </p>
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Talk to the <span className="text-[#FFC107]">{SITE_NAME}</span> team
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-white/75 sm:text-base">
                Reach us for machine listings, dealer support, account help, verification, and marketplace assistance.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFC107] text-black">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white">Verified platform contact</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Contact Owner</p>
                <h2 className="mt-1 text-xl font-extrabold text-gray-900">{contactOwner}</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Support availability</p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Send a message anytime. Our team will respond as soon as possible during business hours.
                    </p>
                  </div>
                </div>
              </div>

              {socialLinks.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-gray-500">Social Links</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-amber-300 hover:text-amber-700"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {getPlatformLabel(item.platform)}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="h-10 w-10 rounded-lg bg-gray-100" />
                  <div className="mt-5 h-4 w-24 rounded bg-gray-100" />
                  <div className="mt-3 h-5 w-40 rounded bg-gray-100" />
                </div>
              ))
            ) : hasContact ? (
              <>
                {contact.phoneNumber ? (
                  <a href={phoneHref || undefined} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition group-hover:bg-[#FFC107] group-hover:text-black">
                      <Phone className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gray-500">Phone Number</p>
                    <p className="mt-2 text-lg font-extrabold text-gray-900">{contact.phoneNumber}</p>
                    {contact.phoneLabel ? <p className="mt-1 text-sm text-gray-500">{contact.phoneLabel}</p> : null}
                  </a>
                ) : null}

                {contact.emailAddress ? (
                  <a href={`mailto:${contact.emailAddress}`} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition group-hover:bg-[#FFC107] group-hover:text-black">
                      <Mail className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gray-500">Email Address</p>
                    <p className="mt-2 break-words text-lg font-extrabold text-gray-900">{contact.emailAddress}</p>
                    {contact.emailLabel ? <p className="mt-1 text-sm text-gray-500">{contact.emailLabel}</p> : null}
                  </a>
                ) : null}

                {contact.address ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gray-500">Office Address</p>
                    <p className="mt-2 whitespace-pre-line text-base font-bold leading-7 text-gray-900">{contact.address}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:col-span-2">
                <p className="text-lg font-extrabold text-gray-900">Contact details are not configured yet.</p>
                <p className="mt-2 text-sm text-gray-500">
                  Please add phone, email, or address from footer settings in the admin portal.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-xl bg-[#111111] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#FFC107]">Need machine support?</p>
            <p className="mt-1 text-sm text-white/70">Browse available equipment or contact our support team directly.</p>
          </div>
          <Link href="/machines" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFC107] px-5 py-3 text-sm font-extrabold text-black transition hover:bg-amber-400">
            Browse Machines
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
