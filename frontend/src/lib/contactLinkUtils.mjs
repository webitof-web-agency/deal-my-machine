export const normalizeExternalUrl = (value) => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return '';

  const candidateValue = /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;

  try {
    const parsedUrl = new URL(candidateValue);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.toString() : '';
  } catch {
    return '';
  }
};

export const getDialHref = (phoneNumber) => {
  const digits = phoneNumber.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
};
