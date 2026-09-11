type ListingLocationLike = {
  address?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
};

type FormatListingLocationOptions = {
  includeAddress?: boolean;
  fallback?: string;
};

export const formatListingLocation = (
  listing: ListingLocationLike,
  options: FormatListingLocationOptions = {}
) => {
  const { includeAddress = false, fallback = '' } = options;
  const parts = includeAddress
    ? [listing.address, listing.locationCity, listing.locationState]
    : [listing.locationCity, listing.locationState];
  const label = parts
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ');

  return label || fallback;
};

