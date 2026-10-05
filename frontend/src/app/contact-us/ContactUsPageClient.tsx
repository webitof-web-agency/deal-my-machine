'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, ExternalLink, Globe, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import api from '@/lib/api';
import { SITE_NAME } from '@/lib/site';
import { getDialHref, normalizeExternalUrl } from '@/lib/contactLinkUtils.mjs';

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

type FooterSettingsResponse = {
  success: boolean;
  data?: {
    socialLinks?: FooterSocialLink[];
    contact?: FooterContact;
    adminWhatsappNumber?: string | null;
  };
};

type ResolvedContact = {
  phoneNumber: string;
  phoneLabel: string;
  emailAddress: string;
  emailLabel: string;
  address: string;
  googleMapsUrl: string;
};

const emptyContact: ResolvedContact = {
  phoneNumber: '',
  phoneLabel: '',
  emailAddress: '',
  emailLabel: '',
  address: '',
  googleMapsUrl: '',
};

const getPlatformLabel = (platform: string) => {
  const normalized = platform.toUpperCase();
  if (normalized === 'TWITTER') return 'X';
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

/** Build a wa.me URL from a raw phone number string */
const buildWhatsappUrl = (rawNumber: string, message?: string) => {
  const digits = rawNumber.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;
  const e164 = digits.length === 10 ? `91${digits}` : digits;
  const encodedMsg = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${e164}${encodedMsg}`;
};

export default function ContactUsPageClient() {
  const [contact, setContact] = React.useState<ResolvedContact>(emptyContact);
  const [socialLinks, setSocialLinks] = React.useState<FooterSocialLink[]>([]);
  const [whatsappNumber, setWhatsappNumber] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Pulse animation state for the WhatsApp button — stops after 6 s
  const [pulsing, setPulsing] = React.useState(true);

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
          googleMapsUrl: (footerContact?.googleMapsUrl || '').trim(),
        });
        setSocialLinks(nextSocialLinks);

        const rawWa = response.data.data?.adminWhatsappNumber || null;
        setWhatsappNumber(rawWa);
      } catch {
        if (!cancelled) {
          setContact(emptyContact);
          setSocialLinks([]);
          setWhatsappNumber(null);
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

  // Stop pulsing after 6 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => setPulsing(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  const contactOwner = contact.emailLabel || contact.phoneLabel || `${SITE_NAME} Support Team`;
  const hasContact = Boolean(contact.phoneNumber || contact.emailAddress || contact.address);
  const phoneHref = contact.phoneNumber ? getDialHref(contact.phoneNumber) : '';

  const whatsappUrl = whatsappNumber
    ? buildWhatsappUrl(whatsappNumber, `Hello ${SITE_NAME} team, I need assistance.`)
    : null;

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
                    {/* Header row: icon + label + optional map button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Office Address</p>
                      </div>

                      {/* Google Maps button — only visible when URL is configured */}
                      {contact.googleMapsUrl ? (
                        <a
                          id="view-on-map-btn"
                          href={contact.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View office location on Google Maps"
                          title="View on Google Maps"
                          className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#4285F4]/30 bg-[#4285F4]/8 px-3 py-1.5 text-xs font-bold text-[#4285F4] transition hover:border-[#4285F4] hover:bg-[#4285F4] hover:text-white"
                        >
                          {/* Google Maps pin SVG */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                          </svg>
                          View on Map
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      ) : null}
                    </div>

                    <p className="mt-4 whitespace-pre-line text-base font-bold leading-7 text-gray-900">{contact.address}</p>
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

      {/* ── Floating WhatsApp Button ─────────────────────────────────── */}
      {whatsappUrl ? (
        <a
          id="whatsapp-floating-btn"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          title="Chat on WhatsApp"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{ width: 60, height: 60 }}
        >
          {/* Pulse ring – shows for first 6 s */}
          {pulsing && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-60" />
          )}

          {/* WhatsApp green circle with official SVG logo */}
          <span className="relative flex h-full w-full items-center justify-center rounded-full bg-[#25D366]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="32"
              height="32"
              fill="white"
              aria-hidden="true"
            >
              <path d="M16 2C8.28 2 2 8.28 2 16c0 2.47.65 4.8 1.79 6.82L2 30l7.36-1.93A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 01-5.83-1.6l-.42-.25-4.37 1.14 1.17-4.25-.28-.44A11.47 11.47 0 014.5 16c0-6.34 5.16-11.5 11.5-11.5S27.5 9.66 27.5 16 22.34 27.5 16 27.5zm6.3-8.6c-.35-.17-2.06-1.01-2.38-1.13-.32-.12-.55-.17-.78.17-.23.35-.9 1.13-1.1 1.36-.2.23-.4.26-.75.09-.35-.17-1.47-.54-2.8-1.73-1.03-.92-1.73-2.06-1.93-2.41-.2-.35-.02-.54.15-.71.15-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.57-.28-.67-.57-.58-.78-.59h-.66c-.23 0-.6.09-.91.43-.32.35-1.21 1.18-1.21 2.88s1.24 3.34 1.41 3.57c.17.23 2.44 3.73 5.92 5.23.83.36 1.48.57 1.98.73.83.26 1.59.23 2.19.14.67-.1 2.06-.84 2.35-1.65.29-.82.29-1.52.2-1.66-.09-.15-.32-.23-.67-.4z" />
            </svg>
          </span>
        </a>
      ) : null}
    </main>
  );
}
