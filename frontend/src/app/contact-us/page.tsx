import React from 'react';
import { Metadata } from 'next';
import ContactUsPageClient from './ContactUsPageClient';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: `Contact Us | ${SITE_NAME}`,
  description: `Contact ${SITE_NAME} support for heavy equipment marketplace help, dealer support, listing queries, and platform assistance.`,
  alternates: {
    canonical: `${SITE_URL}/contact-us`,
  },
  openGraph: {
    title: `Contact Us | ${SITE_NAME}`,
    description: `Reach the ${SITE_NAME} support team for marketplace, listing, dealer, and account assistance.`,
    url: `${SITE_URL}/contact-us`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

export default function ContactUsPage() {
  return <ContactUsPageClient />;
}
