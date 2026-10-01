const LEGACY_PLATFORM_BRAND_PATTERN = /JCB\s*Exchange/gi;

export const replaceLegacyPlatformBrand = (value, siteName) =>
  value.replace(LEGACY_PLATFORM_BRAND_PATTERN, () => siteName);
