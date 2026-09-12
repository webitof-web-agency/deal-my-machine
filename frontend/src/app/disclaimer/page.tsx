import React from 'react';
import { Metadata } from 'next';
import { Mail, MapPin } from 'lucide-react';
import LegalDocumentShell from '@/components/legal/LegalDocumentShell';
import LegalPageContent from '@/components/legal/LegalPageContent';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `Disclaimer | ${SITE_NAME} - Heavy Machinery Notice`,
  description: `Read the official legal disclaimer for ${SITE_NAME}. Notices regarding equipment specifications, dealer listings, machine verification, and financial liability.`,
  openGraph: {
    title: `Disclaimer | ${SITE_NAME}`,
    description: `Important legal notices and disclaimers for buyers and sellers on ${SITE_NAME}.`,
    url: "https://jcbexchange.com/disclaimer",
    siteName: SITE_NAME,
    type: "website",
  },
  alternates: {
    canonical: "https://jcbexchange.com/disclaimer",
  },
};

export default function DisclaimerPage() {
  return (
    <LegalDocumentShell titleKey="legalPages.disclaimer">
          <LegalPageContent 
            pageKey="disclaimer" 
            fallbackHtml={
              <div className="space-y-8 text-sm sm:text-base text-gray-600 leading-relaxed">
                <section className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    1. Marketplace Facilitation Notice
                  </h2>
                  <p>
                    {SITE_NAME} operates strictly as a digital marketplace connecting independent buyers, sellers, and dealers of heavy equipment. {SITE_NAME} does not own listed vehicles (unless explicitly specified) and is not a direct contract party to individual sale transactions.
                  </p>
                </section>

                <hr className="border-gray-100" />

                <section className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    2. Listing Specifications &amp; Vehicle Condition
                  </h2>
                  <p>
                    Equipment details, engine hours, model specifications, and pricing are uploaded directly by independent sellers and dealers. While we strive to maintain high verification standards, buyers must physically inspect machinery and verify documentation prior to financial settlement.
                  </p>
                </section>

                <hr className="border-gray-100" />

                <section className="space-y-3 pt-2">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    3. Legal Questions &amp; Inquiries
                  </h2>
                  <p>
                    If you have questions regarding this Disclaimer notice, please reach out to us:
                  </p>
                  <div className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2 text-xs sm:text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">{SITE_NAME} Legal Support</p>
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-amber-600" />
                      Plot No. 23, Sector 18, Gurugram, Haryana 122015, India
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={14} className="text-amber-600" />
                      <a href="mailto:hello@jcbexchange.com" className="text-amber-600 hover:underline font-medium">hello@jcbexchange.com</a>
                    </p>
                  </div>
                </section>
              </div>
            } 
          />
    </LegalDocumentShell>
  );
}
