'use client';

import React from 'react';
import api from '@/lib/api';
import { SITE_NAME } from '@/lib/site';

type FooterSettingsResponse = {
  data?: { adminWhatsappNumber?: string | null };
};

const buildWhatsappUrl = (rawNumber: string, message?: string) => {
  const digits = rawNumber.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;
  const e164 = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${e164}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
};

export default function FloatingWhatsAppButton() {
  const [whatsappUrl, setWhatsappUrl] = React.useState<string | null>(null);
  const [pulsing, setPulsing] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const fetchWhatsappNumber = async () => {
      try {
        const response = await api.get<FooterSettingsResponse>('/master/footer');
        if (cancelled) return;
        const rawNumber = response.data.data?.adminWhatsappNumber || '';
        setWhatsappUrl(rawNumber ? buildWhatsappUrl(rawNumber, `Hello ${SITE_NAME} team, I need assistance.`) : null);
      } catch {
        if (!cancelled) setWhatsappUrl(null);
      }
    };
    void fetchWhatsappNumber();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setPulsing(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!whatsappUrl) return null;

  return (
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
      {pulsing ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-60" /> : null}
      <span className="relative flex h-full w-full items-center justify-center rounded-full bg-[#25D366]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="white" aria-hidden="true">
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.47.65 4.8 1.79 6.82L2 30l7.36-1.93A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 01-5.83-1.6l-.42-.25-4.37 1.14 1.17-4.25-.28-.44A11.47 11.47 0 014.5 16c0-6.34 5.16-11.5 11.5-11.5S27.5 9.66 27.5 16 22.34 27.5 16 27.5zm6.3-8.6c-.35-.17-2.06-1.01-2.38-1.13-.32-.12-.55-.17-.78.17-.23.35-.9 1.13-1.1 1.36-.2.23-.4.26-.75.09-.35-.17-1.47-.54-2.8-1.73-1.03-.92-1.73-2.06-1.93-2.41-.2-.35-.02-.54.15-.71.15-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.57-.28-.67-.57-.58-.78-.59h-.66c-.23 0-.6.09-.91.43-.32.35-1.21 1.18-1.21 2.88s1.24 3.34 1.41 3.57c.17.23 2.44 3.73 5.92 5.23.83.36 1.48.57 1.98.73.83.26 1.59.23 2.19.14.67-.1 2.06-.84 2.35-1.65.29-.82.29-1.52.2-1.66-.09-.15-.32-.23-.67-.4z" />
        </svg>
      </span>
    </a>
  );
}
