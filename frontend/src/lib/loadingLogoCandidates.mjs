/** @param {{ initialLogoUrl?: string | null, darkLogoUrl?: string | null, logoUrl?: string | null, staticLogoUrl?: string | null }} input @returns {string[]} */
export const getLoadingLogoCandidates = ({ initialLogoUrl = null, darkLogoUrl = null, logoUrl = null, staticLogoUrl = null }) =>
  [staticLogoUrl, initialLogoUrl, darkLogoUrl, logoUrl].filter((value, index, values) => typeof value === 'string' && values.indexOf(value) === index);
