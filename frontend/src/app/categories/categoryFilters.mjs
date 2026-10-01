const normalize = (value) => String(value || '').trim();

const sortByCountThenName = (left, right) =>
  right.count - left.count || left.name.localeCompare(right.name);

const matchesSearch = (listing, query) => {
  if (!query) return true;

  return [listing.title, listing.category?.name, listing.brand?.name]
    .map(normalize)
    .join(' ')
    .toLowerCase()
    .includes(query);
};

export const getListingCondition = (listing) => normalize(listing.condition) || 'Unspecified';

export const buildCategoryFilterData = ({
  categories,
  listings,
  search,
  selectedCategory,
  selectedBrands,
  selectedConditions,
}) => {
  const query = normalize(search).toLowerCase();
  const filteredListings = listings.filter((listing) => {
    if (selectedCategory !== 'ALL' && listing.category?.id !== selectedCategory) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(normalize(listing.brand?.name))) return false;
    if (selectedConditions.length > 0 && !selectedConditions.includes(getListingCondition(listing))) return false;
    return matchesSearch(listing, query);
  });

  const categoryCounts = new Map();
  const brandCounts = new Map();
  const conditionCounts = new Map();

  filteredListings.forEach((listing) => {
    if (listing.category?.id) {
      categoryCounts.set(listing.category.id, (categoryCounts.get(listing.category.id) || 0) + 1);
    }

    const brandName = normalize(listing.brand?.name);
    if (brandName) brandCounts.set(brandName, (brandCounts.get(brandName) || 0) + 1);

    const conditionName = getListingCondition(listing);
    conditionCounts.set(conditionName, (conditionCounts.get(conditionName) || 0) + 1);
  });

  const categoryOptions = categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      count: categoryCounts.get(category.id) || 0,
    }))
    .filter((category) => category.count > 0);

  const brandOptions = Array.from(brandCounts, ([name, count]) => ({ name, count }))
    .sort(sortByCountThenName);
  const conditionOptions = Array.from(conditionCounts, ([name, count]) => ({ name, count }))
    .sort(sortByCountThenName);

  return { filteredListings, categoryOptions, brandOptions, conditionOptions };
};
