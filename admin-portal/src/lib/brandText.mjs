const LEGACY_PLATFORM_BRAND_PATTERN = /JCB\s*Exchange/gi;
const DEFAULT_PLATFORM_BRAND = 'DealMyMachine';

export const replaceLegacyPlatformBrand = (value, siteName = DEFAULT_PLATFORM_BRAND) =>
  value.replace(LEGACY_PLATFORM_BRAND_PATTERN, () => siteName);
