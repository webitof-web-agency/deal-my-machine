const STATIC_SITE_LOGOS = {
  navbar: '/branding/frontendlogo.png',
  login: '/branding/loginfrontlogo.png',
  footer: '/branding/logofooter.png',
};

export function getStaticSiteLogo(variant = 'navbar') {
  return STATIC_SITE_LOGOS[variant] || STATIC_SITE_LOGOS.navbar;
}
