export function isStaticBrandingAsset(url) {
  return typeof url === 'string' && url.startsWith('/branding/');
}
