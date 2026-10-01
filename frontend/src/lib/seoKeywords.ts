import { SITE_NAME } from './site';

export const SEO_KEYWORD_CLUSTERS = {
  homepage: [
    'New and Used Heavy Machinery for Sale in India',
    'Construction Equipment Marketplace India',
    'Buy and Sell Heavy Equipment Online',
    'Heavy Machinery Dealers in India',
  ],
  machines: [
    'New and Used Construction Machinery for Sale in India',
    'Used Heavy Machinery for Sale in India',
    'Construction Equipment for Sale',
    'Heavy Equipment Marketplace India',
  ],
  categories: [
    'Used Excavator for Sale',
    'Backhoe Loader for Sale',
    'JCB 3DX Backhoe Loader for Sale',
    'Wheel Loader for Sale',
    'Bulldozer for Sale',
    'Motor Grader for Sale',
    'Road Roller and Compactor for Sale',
    'Dump Truck and Tipper for Sale',
    'Forklift and Telehandler for Sale',
    'Paver Machine for Sale',
  ],
  sell: [
    'Sell Used Heavy Machinery Online',
    'Sell Construction Equipment Online',
    'Buy Second Hand Construction Machinery',
    'Pre-Owned Heavy Equipment for Sale',
    'New Construction Machinery Price in India',
    'Used Excavator Price in India',
    'Heavy Machinery Finance and EMI',
  ],
  dealers: [
    'Heavy Machinery Dealer Near Me',
    'Construction Equipment Dealer in India',
    'JCB Dealer Near Me',
    'Used Excavator Dealer in India',
  ],
} as const;

export type SeoKeywordCluster = keyof typeof SEO_KEYWORD_CLUSTERS;

export const getSeoKeywordCluster = (cluster: SeoKeywordCluster): string[] => [
  ...SEO_KEYWORD_CLUSTERS[cluster],
];

export const getSeoKeywordText = (cluster: SeoKeywordCluster): string =>
  getSeoKeywordCluster(cluster).join(', ');

export const DEFAULT_SITE_SEO_DESCRIPTION =
  `${SITE_NAME} is India's marketplace for new and used heavy machinery, construction equipment, trusted dealers, and verified listings.`;

export const buildLocationKeyword = (keyword: string, city: string, state?: string | null): string => {
  const location = [city, state].map((value) => value?.trim()).filter(Boolean).join(', ');
  return location ? `${keyword} in ${location}` : keyword;
};

export const buildMachineLocationTitle = ({
  category,
  city,
  state,
}: {
  category?: string | null;
  city: string;
  state?: string | null;
}): string => {
  const subject = category?.trim() ? `${category.trim()} Machines for Sale` : 'Heavy Machinery for Sale';
  const location = [city, state].map((value) => value?.trim()).filter(Boolean).join(', ');
  return `${subject} in ${location}`;
};

export const buildMachineLocationDescription = ({
  category,
  city,
  state,
}: {
  category?: string | null;
  city: string;
  state?: string | null;
}): string => {
  const subject = category?.trim()
    ? `${category.trim().toLowerCase()} machines`
    : 'new and used heavy machinery';
  const location = [city, state].map((value) => value?.trim()).filter(Boolean).join(', ');
  return `Browse verified ${subject} for sale in ${location} on ${SITE_NAME}. Compare prices, specifications, seller details, and finance options.`;
};
