import { slugify } from './routeSlug';

export const MACHINE_LOCATION_BASE_PATH = '/machines/location';

export type SeoLocation = {
  city: string;
  state?: string | null;
};

const normalizeLocationPart = (value?: string | null): string => value?.trim() || '';

export const formatSeoLocation = ({ city, state }: SeoLocation): string =>
  [normalizeLocationPart(city), normalizeLocationPart(state)].filter(Boolean).join(', ');

export const parseSeoLocationLabel = (label: string): SeoLocation => {
  const [city, ...stateParts] = label.split(',');
  return {
    city: city?.trim() || '',
    state: stateParts.join(',').trim() || null,
  };
};

export const buildSeoLocationSlug = ({ city, state }: SeoLocation): string =>
  slugify([normalizeLocationPart(city), normalizeLocationPart(state)].filter(Boolean).join('-'));

export const buildSeoCategorySlug = (category: string): string => slugify(category);

export const buildMachineLocationPath = ({ city, state }: SeoLocation): string => {
  const locationSlug = buildSeoLocationSlug({ city, state });
  return locationSlug ? `${MACHINE_LOCATION_BASE_PATH}/${locationSlug}` : MACHINE_LOCATION_BASE_PATH;
};

export const buildMachineLocationCategoryPath = ({
  city,
  state,
  category,
}: SeoLocation & { category: string }): string => {
  const locationSlug = buildSeoLocationSlug({ city, state });
  const categorySlug = buildSeoCategorySlug(category);

  if (!locationSlug || !categorySlug) {
    return buildMachineLocationPath({ city, state });
  }

  return `${MACHINE_LOCATION_BASE_PATH}/${locationSlug}/${categorySlug}`;
};

export const normalizeSeoLocationSlug = (value: string): string => slugify(value);
