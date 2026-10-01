export const getFeaturedListingMediaQuery = () => ({
  where: { type: 'IMAGE' as const },
  orderBy: [
    { isFeatured: 'desc' as const },
    { createdAt: 'asc' as const },
  ],
  take: 1,
  select: {
    url: true,
    type: true,
    isFeatured: true,
    createdAt: true,
  },
});
