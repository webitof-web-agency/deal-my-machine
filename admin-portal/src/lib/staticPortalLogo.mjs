const STATIC_PORTAL_LOGOS = {
  header: '/branding/adminportallogo.png',
  login: '/branding/loginadminlogo.png',
  footer: '/branding/adminportallogo.png',
};

export function getStaticPortalLogo(size = 'header') {
  return STATIC_PORTAL_LOGOS[size] || STATIC_PORTAL_LOGOS.header;
}
