import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    default: `Careers at ${SITE_NAME}`,
    template: `%s | ${SITE_NAME} Careers`,
  },
  description: `Explore careers and job opportunities at ${SITE_NAME}, India's heavy machinery and construction equipment marketplace.`,
  alternates: {
    canonical: `${SITE_URL}/jobs`,
  },
  openGraph: {
    title: `Careers at ${SITE_NAME}`,
    description: `Explore careers and job opportunities at ${SITE_NAME}.`,
    url: `${SITE_URL}/jobs`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
