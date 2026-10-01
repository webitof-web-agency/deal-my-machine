export const calculateMonthlyEmi = (principal, annualInterestRate, tenureYears) => {
  const amount = Math.max(0, Number(principal) || 0);
  const months = Math.max(1, Math.round((Number(tenureYears) || 0) * 12));
  const monthlyRate = Math.max(0, Number(annualInterestRate) || 0) / 1200;

  if (amount === 0) return 0;
  if (monthlyRate === 0) return Math.round(amount / months);

  const growth = (1 + monthlyRate) ** months;
  return Math.round((amount * monthlyRate * growth) / (growth - 1));
};

export const rankRelatedListings = (listings, currentListing) => listings
  .filter((listing) => listing.id !== currentListing.id && listing.status !== 'SOLD')
  .map((listing) => ({
    listing,
    score:
      (listing.category?.id && listing.category.id === currentListing.category?.id ? 2 : 0) +
      (listing.brand?.id && listing.brand.id === currentListing.brand?.id ? 1 : 0),
  }))
  .sort((left, right) => right.score - left.score)
  .map(({ listing }) => listing);
