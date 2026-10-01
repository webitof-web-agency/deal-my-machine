const normalize = (value) => String(value || '').trim();

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === 'object' && item !== null ? [item.name] : [item]))
      .map(normalize)
      .filter(Boolean);
  }

  const text = normalize(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return normalizeList(parsed);
  } catch {
    // Service areas are also stored as human-entered comma-separated text.
  }

  return text
    .split(/[,|;\n]+/)
    .map(normalize)
    .filter(Boolean);
};

const uniqueSorted = (values) => Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));

const facetValues = (dealer, field) => {
  if (field === 'services') return normalizeList(dealer.serviceAreas);
  return normalizeList(dealer[field]);
};

export const getDealerFacetValues = (dealer, field) => facetValues(dealer, field);

const matchesSearch = (dealer, query) => {
  if (!query) return true;

  return [
    dealer.businessName,
    dealer.district,
    dealer.businessAddress,
    dealer.businessDescription,
    dealer.partnerType,
    ...facetValues(dealer, 'categories'),
    ...facetValues(dealer, 'services'),
  ]
    .map(normalize)
    .join(' ')
    .toLowerCase()
    .includes(query);
};

const matchesSelected = (dealer, selected, field) => {
  if (selected.length === 0) return true;
  const values = facetValues(dealer, field);
  return selected.some((value) => values.includes(value));
};

const sortOptions = (left, right) => right.count - left.count || left.name.localeCompare(right.name);

const buildOptions = (dealers, field) => {
  const counts = new Map();
  dealers.forEach((dealer) => {
    const values = field === 'dealerTypes'
      ? [normalize(dealer.partnerType)]
      : field === 'locations'
        ? [normalize(dealer.district)]
        : facetValues(dealer, field);

    new Set(values.filter(Boolean)).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(sortOptions);
};

export const buildDealerFilterData = ({
  dealers,
  search,
  selectedLocation,
  selectedDealerTypes,
  selectedCategories,
  selectedServices,
}) => {
  const query = normalize(search).toLowerCase();
  const normalizedLocation = normalize(selectedLocation).toLowerCase();
  const filteredDealers = dealers.filter((dealer) => {
    if (!matchesSearch(dealer, query)) return false;
    if (normalizedLocation && ![dealer.district, dealer.businessAddress].map(normalize).join(' ').toLowerCase().includes(normalizedLocation)) return false;
    if (selectedDealerTypes.length > 0 && !selectedDealerTypes.includes(normalize(dealer.partnerType))) return false;
    if (!matchesSelected(dealer, selectedCategories, 'categories')) return false;
    if (!matchesSelected(dealer, selectedServices, 'services')) return false;
    return true;
  });

  return {
    filteredDealers,
    locationOptions: buildOptions(filteredDealers, 'locations'),
    dealerTypeOptions: buildOptions(filteredDealers, 'dealerTypes'),
    categoryOptions: buildOptions(filteredDealers, 'categories'),
    serviceOptions: buildOptions(filteredDealers, 'services'),
    allLocations: uniqueSorted(dealers.map((dealer) => normalize(dealer.district)).filter(Boolean)),
  };
};
